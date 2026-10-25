import fs from "fs";
import path from "path";

export interface CatalystSecrets {
  polygonApiKey: string;
  openAiApiKey: string;
}

const SECRETS_FILE_PATH = path.resolve(process.cwd(), "../.secrets.toml");

/**
 * Loads API keys from the single workspace root `.secrets.toml` file (or environment variables).
 */
export function loadSecrets(): CatalystSecrets {
  let polygonApiKey = process.env.POLYGON_API_KEY ?? "";
  let openAiApiKey = process.env.OPENAI_API_KEY ?? "";

  try {
    if (fs.existsSync(SECRETS_FILE_PATH)) {
      const raw = fs.readFileSync(SECRETS_FILE_PATH, "utf8");
      const polyMatch = raw.match(/polygon_api_key\s*=\s*["']([^"']+)["']/);
      const oaiMatch =
        raw.match(/\[default\.openai\][\s\S]*?api_key\s*=\s*["']([^"']+)["']/) ??
        raw.match(/api_key\s*=\s*["'](sk-[^"']+)["']/);

      if (polyMatch?.[1]) polygonApiKey = polyMatch[1].trim();
      if (oaiMatch?.[1]) openAiApiKey = oaiMatch[1].trim();
    }
  } catch {
    // Fallback to environment variables if file read fails
  }

  return {
    polygonApiKey,
    openAiApiKey,
  };
}
