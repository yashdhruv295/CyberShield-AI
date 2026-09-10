import express from "express";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

import {
  GoogleGenAI,
} from "@google/genai";

dotenv.config();

const app =
  express();

const PORT =
  Number(
    process.env.PORT
  ) || 5000;

const VIRUSTOTAL_API_KEY =
  process.env
    .VIRUSTOTAL_API_KEY ||
  "";

const GEMINI_API_KEY =
  process.env
    .GEMINI_API_KEY ||
  "";

const FRONTEND_URL =
  process.env
    .FRONTEND_URL ||
  "";

const VT_BASE =
  "https://www.virustotal.com/api/v3";

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        32 *
        1024 *
        1024,
    },
  });

const allowedOrigin = (
  origin?: string
) => {
  if (!origin) {
    return true;
  }

  if (
    FRONTEND_URL &&
    origin ===
      FRONTEND_URL
  ) {
    return true;
  }

  if (
    /^http:\/\/localhost:517\d$/.test(
      origin
    )
  ) {
    return true;
  }

  if (
    /^http:\/\/127\.0\.0\.1:517\d$/.test(
      origin
    )
  ) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (
        allowedOrigin(
          origin
        )
      ) {
        callback(
          null,
          true
        );

        return;
      }

      callback(
        new Error(
          "Origin not allowed by CORS."
        )
      );
    },
  })
);

app.use(
  express.json({
    limit:
      "2mb",
  })
);

app.use(
  express.urlencoded({
    extended:
      true,
  })
);

/* =========================
   HELPERS
========================= */

function sleep(
  milliseconds: number
) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

function clampScore(
  score: number
) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        score
      )
    )
  );
}

function getRiskLevel(
  riskScore: number
) {
  if (
    riskScore >= 70
  ) {
    return "HIGH RISK";
  }

  if (
    riskScore >= 35
  ) {
    return "SUSPICIOUS";
  }

  if (
    riskScore > 10
  ) {
    return "LOW RISK";
  }

  return "SAFE";
}

type VtStats = {
  harmless?: number;
  malicious?: number;
  suspicious?: number;
  undetected?: number;
  timeout?: number;
  failure?: number;
  unsupported?: number;
};

function normalizeStats(
  input?: VtStats
) {
  return {
    harmless:
      Number(
        input?.harmless ||
          0
      ),

    malicious:
      Number(
        input?.malicious ||
          0
      ),

    suspicious:
      Number(
        input?.suspicious ||
          0
      ),

    undetected:
      Number(
        input?.undetected ||
          0
      ),

    timeout:
      Number(
        input?.timeout ||
          0
      ),

    failure:
      Number(
        input?.failure ||
          0
      ),

    unsupported:
      Number(
        input?.unsupported ||
          0
      ),
  };
}

function calculateRisk(
  stats:
    ReturnType<
      typeof normalizeStats
    >
) {
  const total =
    stats.harmless +
    stats.malicious +
    stats.suspicious +
    stats.undetected +
    stats.timeout +
    stats.failure +
    stats.unsupported;

  if (
    total === 0
  ) {
    return 0;
  }

  const weighted =
    stats.malicious *
      100 +
    stats.suspicious *
      55 +
    stats.timeout *
      10;

  return clampScore(
    weighted / total
  );
}

function extractJson(
  text: string
) {
  const clean =
    text
      .replace(
        /```json/gi,
        ""
      )
      .replace(
        /```/g,
        ""
      )
      .trim();

  const first =
    clean.indexOf("{");

  const last =
    clean.lastIndexOf(
      "}"
    );

  if (
    first < 0 ||
    last < first
  ) {
    throw new Error(
      "Gemini did not return valid JSON."
    );
  }

  return JSON.parse(
    clean.slice(
      first,
      last + 1
    )
  );
}

const ai =
  GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey:
          GEMINI_API_KEY,
      })
    : null;

const GEMINI_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

async function callGemini(
  prompt: string
) {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured."
    );
  }

  let lastError:
    unknown = null;

  for (
    const model of
    GEMINI_MODELS
  ) {
    for (
      let attempt = 0;
      attempt < 3;
      attempt++
    ) {
      try {
        const response =
          await ai.models.generateContent(
            {
              model,

              contents:
                prompt,
            }
          );

        const text =
          response.text;

        if (
          text?.trim()
        ) {
          return {
            text:
              text.trim(),
            model,
          };
        }

        throw new Error(
          "Gemini returned an empty response."
        );
      } catch (error) {
        lastError =
          error;

        console.error(
          `Gemini ${model} attempt ${
            attempt + 1
          } failed:`,
          error
        );

        if (
          attempt < 2
        ) {
          await sleep(
            1000 *
              2 ** attempt
          );
        }
      }
    }
  }

  throw lastError instanceof
    Error
    ? lastError
    : new Error(
        "Gemini service failed."
      );
}

/* =========================
   ROOT / HEALTH
========================= */

app.get(
  "/",
  (
    _request,
    response
  ) => {
    response.json({
      success:
        true,

      message:
        "CyberShield AI Backend is running.",
    });
  }
);

app.get(
  "/api/health",
  (
    _request,
    response
  ) => {
    response.json({
      success:
        true,

      server:
        "CyberShield AI",

      virusTotalConfigured:
        Boolean(
          VIRUSTOTAL_API_KEY
        ),

      geminiConfigured:
        Boolean(
          GEMINI_API_KEY
        ),
    });
  }
);

/* =========================
   URL SCANNER
========================= */

app.post(
  "/api/scan-url",
  async (
    request:
      Request,
    response:
      Response
  ) => {
    const url =
      String(
        request.body?.url ||
          ""
      ).trim();

    if (!url) {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "URL is required.",
        });

      return;
    }

    try {
      const parsed =
        new URL(url);

      if (
        parsed.protocol !==
          "http:" &&
        parsed.protocol !==
          "https:"
      ) {
        throw new Error();
      }
    } catch {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "Invalid URL.",
        });

      return;
    }

    if (
      !VIRUSTOTAL_API_KEY
    ) {
      response
        .status(500)
        .json({
          success:
            false,

          message:
            "VirusTotal API key is not configured.",
        });

      return;
    }

    try {
      const body =
        new URLSearchParams();

      body.set(
        "url",
        url
      );

      const submitResponse =
        await axios.post(
          `${VT_BASE}/urls`,
          body.toString(),
          {
            headers: {
              "x-apikey":
                VIRUSTOTAL_API_KEY,

              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );

      const analysisId =
        submitResponse.data
          ?.data?.id;

      if (!analysisId) {
        throw new Error(
          "VirusTotal did not return an analysis ID."
        );
      }

      let analysis:
        any = null;

      for (
        let attempt = 0;
        attempt < 12;
        attempt++
      ) {
        const analysisResponse =
          await axios.get(
            `${VT_BASE}/analyses/${analysisId}`,
            {
              headers: {
                "x-apikey":
                  VIRUSTOTAL_API_KEY,
              },
            }
          );

        analysis =
          analysisResponse.data
            ?.data;

        const status =
          analysis?.attributes
            ?.status;

        if (
          status ===
          "completed"
        ) {
          break;
        }

        await sleep(
          2000
        );
      }

      const status =
        analysis?.attributes
          ?.status ||
        "unknown";

      if (
        status !==
        "completed"
      ) {
        response.json({
          success:
            true,

          pending:
            true,

          url,

          analysisId,

          status,

          stats:
            normalizeStats(),

          riskScore:
            0,

          riskLevel:
            "UNKNOWN",

          message:
            "VirusTotal analysis is still processing. Please try again shortly.",
        });

        return;
      }

      const stats =
        normalizeStats(
          analysis.attributes
            ?.stats
        );

      const riskScore =
        calculateRisk(
          stats
        );

      response.json({
        success:
          true,

        pending:
          false,

        url,

        analysisId,

        status,

        stats,

        riskScore,

        riskLevel:
          getRiskLevel(
            riskScore
          ),
      });
    } catch (error) {
      console.error(
        "URL Scan Error:",
        error
      );

      response
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to scan URL with VirusTotal.",
        });
    }
  }
);

/* =========================
   FILE SCANNER
========================= */

app.post(
  "/api/scan-file",

  upload.single(
    "file"
  ),

  async (
    request:
      Request,
    response:
      Response
  ) => {
    if (
      !request.file
    ) {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "Please upload a file.",
        });

      return;
    }

    if (
      !VIRUSTOTAL_API_KEY
    ) {
      response
        .status(500)
        .json({
          success:
            false,

          message:
            "VirusTotal API key is not configured.",
        });

      return;
    }

    try {
      const form =
        new FormData();

      form.append(
        "file",
        request.file
          .buffer,
        {
          filename:
            request.file
              .originalname,

          contentType:
            request.file
              .mimetype,
        }
      );

      const submitResponse =
        await axios.post(
          `${VT_BASE}/files`,
          form,
          {
            headers: {
              ...form.getHeaders(),

              "x-apikey":
                VIRUSTOTAL_API_KEY,
            },

            maxBodyLength:
              Infinity,

            maxContentLength:
              Infinity,
          }
        );

      const analysisId =
        submitResponse.data
          ?.data?.id;

      if (!analysisId) {
        throw new Error(
          "VirusTotal did not return a file analysis ID."
        );
      }

      let analysis:
        any = null;

      for (
        let attempt = 0;
        attempt < 15;
        attempt++
      ) {
        const analysisResponse =
          await axios.get(
            `${VT_BASE}/analyses/${analysisId}`,
            {
              headers: {
                "x-apikey":
                  VIRUSTOTAL_API_KEY,
              },
            }
          );

        analysis =
          analysisResponse.data
            ?.data;

        if (
          analysis?.attributes
            ?.status ===
          "completed"
        ) {
          break;
        }

        await sleep(
          3000
        );
      }

      const status =
        analysis?.attributes
          ?.status ||
        "unknown";

      if (
        status !==
        "completed"
      ) {
        response.json({
          success:
            true,

          pending:
            true,

          analysisId,

          fileName:
            request.file
              .originalname,

          fileSize:
            request.file
              .size,

          mimeType:
            request.file
              .mimetype,

          message:
            "VirusTotal file analysis is still processing.",
        });

        return;
      }

      const stats =
        normalizeStats(
          analysis.attributes
            ?.stats
        );

      const riskScore =
        calculateRisk(
          stats
        );

      response.json({
        success:
          true,

        pending:
          false,

        analysisId,

        fileName:
          request.file
            .originalname,

        fileSize:
          request.file
            .size,

        mimeType:
          request.file
            .mimetype,

        stats,

        riskScore,

        riskLevel:
          getRiskLevel(
            riskScore
          ),
      });
    } catch (error) {
      console.error(
        "File Scan Error:",
        error
      );

      response
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to scan file with VirusTotal.",
        });
    }
  }
);

/* =========================
   AI EMAIL / MESSAGE
========================= */

type AnalyzerType =
  | "EMAIL"
  | "MESSAGE";

async function analyzeText(
  content: string,
  type:
    AnalyzerType
) {
  const sourceName =
    type === "EMAIL"
      ? "email"
      : "SMS or WhatsApp message";

  const prompt = `
You are a cybersecurity analysis assistant.

Analyze the following ${sourceName} for phishing, fraud, scams, social engineering, malicious links, credential theft, payment fraud, OTP theft, impersonation and suspicious urgency.

Return ONLY valid JSON.
Do not use Markdown code fences.

Required JSON format:

{
  "riskLevel": "SAFE | LOW RISK | SUSPICIOUS | HIGH RISK",
  "riskScore": 0,
  "summary": "short summary",
  "reasons": ["reason 1", "reason 2"],
  "suspiciousElements": ["element 1"],
  "recommendation": "clear safety recommendation"
}

Risk score must be between 0 and 100.

Content:
${content}
`;

  const aiResponse =
    await callGemini(
      prompt
    );

  const parsed =
    extractJson(
      aiResponse.text
    );

  const allowedLevels = [
    "SAFE",
    "LOW RISK",
    "SUSPICIOUS",
    "HIGH RISK",
  ];

  const riskLevel =
    allowedLevels.includes(
      String(
        parsed.riskLevel
      ).toUpperCase()
    )
      ? String(
          parsed.riskLevel
        ).toUpperCase()
      : "SUSPICIOUS";

  return {
    success:
      true,

    type,

    riskLevel,

    riskScore:
      clampScore(
        Number(
          parsed.riskScore ||
            0
        )
      ),

    summary:
      String(
        parsed.summary ||
          "Analysis completed."
      ),

    reasons:
      Array.isArray(
        parsed.reasons
      )
        ? parsed.reasons.map(
            String
          )
        : [],

    suspiciousElements:
      Array.isArray(
        parsed.suspiciousElements
      )
        ? parsed.suspiciousElements.map(
            String
          )
        : [],

    recommendation:
      String(
        parsed.recommendation ||
          "Use caution and verify the sender."
      ),

    model:
      aiResponse.model,
  };
}

app.post(
  "/api/analyze-email",
  async (
    request:
      Request,
    response:
      Response
  ) => {
    const content =
      String(
        request.body
          ?.content ||
          ""
      ).trim();

    if (
      content.length <
      5
    ) {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "Email content is required.",
        });

      return;
    }

    try {
      const result =
        await analyzeText(
          content,
          "EMAIL"
        );

      response.json(
        result
      );
    } catch (error) {
      console.error(
        "Email Gemini Error:",
        error
      );

      response
        .status(503)
        .json({
          success:
            false,

          message:
            "Gemini service is temporarily unavailable. Please try again.",
        });
    }
  }
);

app.post(
  "/api/analyze-message",
  async (
    request:
      Request,
    response:
      Response
  ) => {
    const content =
      String(
        request.body
          ?.content ||
          ""
      ).trim();

    if (
      content.length <
      5
    ) {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "Message content is required.",
        });

      return;
    }

    try {
      const result =
        await analyzeText(
          content,
          "MESSAGE"
        );

      response.json(
        result
      );
    } catch (error) {
      console.error(
        "Message Gemini Error:",
        error
      );

      response
        .status(503)
        .json({
          success:
            false,

          message:
            "Gemini service is temporarily unavailable. Please try again.",
        });
    }
  }
);

/* =========================
   CYBER AI ASSISTANT
========================= */

app.post(
  "/api/assistant",
  async (
    request:
      Request,
    response:
      Response
  ) => {
    const message =
      String(
        request.body
          ?.message ||
          ""
      ).trim();

    if (!message) {
      response
        .status(400)
        .json({
          success:
            false,

          message:
            "Question is required.",
        });

      return;
    }

    const prompt = `
You are CyberShield AI Assistant.

You provide defensive cybersecurity education for students and normal users.

Help with:
- phishing awareness
- scams
- account security
- password security
- safe browsing
- malware awareness
- privacy
- cyber hygiene
- incident response
- defensive security concepts

Do not provide instructions that facilitate malware creation, credential theft, unauthorized access, destructive attacks or other harmful cyber abuse.

Answer clearly and practically.

User question:
${message}
`;

    try {
      const result =
        await callGemini(
          prompt
        );

      response.json({
        success:
          true,

        answer:
          result.text,

        model:
          result.model,
      });
    } catch (error) {
      console.error(
        "Assistant Error:",
        error
      );

      response
        .status(503)
        .json({
          success:
            false,

          message:
            "Cyber AI Assistant is temporarily unavailable. Please try again.",
        });
    }
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (
    error:
      Error,
    _request:
      Request,
    response:
      Response,
    _next:
      NextFunction
  ) => {
    console.error(
      "Server Error:",
      error
    );

    if (
      error instanceof
        multer.MulterError &&
      error.code ===
        "LIMIT_FILE_SIZE"
    ) {
      response
        .status(413)
        .json({
          success:
            false,

          message:
            "Maximum file size is 32 MB.",
        });

      return;
    }

    if (
      error.message ===
      "Origin not allowed by CORS."
    ) {
      response
        .status(403)
        .json({
          success:
            false,

          message:
            "Frontend origin is not allowed.",
        });

      return;
    }

    response
      .status(500)
      .json({
        success:
          false,

        message:
          "Internal server error.",
      });
  }
);

/* =========================
   START SERVER
========================= */

app.listen(
  PORT,
  () => {
    console.log(
      "==============================="
    );

    console.log(
      "CyberShield AI Server Running"
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      "==============================="
    );
  }
);