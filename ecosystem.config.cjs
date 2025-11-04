module.exports = {
    apps: [
      {
        name: "flashrooms",
        cwd: "/www/wwwroot/flashcard",
        script: "npm",
        args: "run start",
        instances: 1,
        exec_mode: "fork",
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: "production",
          PORT: "3003",

          DATABASE_URL: "postgresql://flashcard_user:xm8wreWmBr!@localhost:5432/flashcard_db",
          NEXTAUTH_SECRET: "qLTOumb/sx2fLRYbomsxOcA5aCiVqhxKB3g6Au0NG+4=",

          STORAGE_BUCKET: "flashrooms",
          STORAGE_ENDPOINT: "http://127.0.0.1:9000",
          STORAGE_PUBLIC_BASE: "https://flashcard.thisnexus.cn/flashrooms",
          STORAGE_REGION: "us-east-1",
          STORAGE_FORCE_PATH_STYLE: "true",
          STORAGE_ACCESS_KEY: "ylong",
          STORAGE_SECRET_KEY: "xm8wreWmBr!",

          OPENROUTER_API_KEY: "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",
          IMAGE_MODEL_ID: "google/gemini-2.5-flash-image",
          RUN_CODE_TTL_MINUTES: "120",
          RUN_CODE_LENGTH: "6"
        }
      }
    ]
  };