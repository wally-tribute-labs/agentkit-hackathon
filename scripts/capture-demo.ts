import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type Page } from "playwright";

const origin = process.env.GROUNDSIGNAL_CAPTURE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = path.resolve(process.cwd(), "docs/assets");
fs.mkdirSync(outputDirectory, { recursive: true });

async function finishReplay(page: Page) {
  for (let step = 0; step < 8; step += 1) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
}

async function main() {
  const videoDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "groundsignal-video-"),
  );
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(origin, { waitUntil: "networkidle" });
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "groundsignal-landing.png"),
  });
  await desktopPage.goto(`${origin}/demo`, { waitUntil: "networkidle" });
  await finishReplay(desktopPage);
  await desktopPage.evaluate(() => window.scrollTo(0, 0));
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "groundsignal-consensus.png"),
    fullPage: true,
  });
  await desktopPage.goto(`${origin}/developers`, { waitUntil: "networkidle" });
  await desktopPage.getByRole("button", { name: "Run request" }).click();
  await desktopPage.getByText("200 OK").waitFor();
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "groundsignal-developers.png"),
    fullPage: true,
  });
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${origin}/demo`, { waitUntil: "networkidle" });
  await mobilePage.screenshot({
    path: path.join(outputDirectory, "groundsignal-mobile.png"),
    fullPage: true,
  });
  await mobile.close();

  const recorded = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    recordVideo: { dir: videoDirectory, size: { width: 1280, height: 720 } },
  });
  const recordedPage = await recorded.newPage();
  const video = recordedPage.video();
  await recordedPage.goto(`${origin}/demo`, { waitUntil: "networkidle" });
  for (let step = 0; step < 8; step += 1) {
    await recordedPage
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await recordedPage.waitForTimeout(250);
  }
  await recordedPage
    .getByRole("button", { name: "cloudy", exact: true })
    .click();
  await recordedPage.getByRole("button", { name: /Add local report/i }).click();
  await recordedPage.waitForTimeout(700);
  await recordedPage.close();
  await video?.saveAs(path.join(outputDirectory, "groundsignal-demo.webm"));
  await recorded.close();

  await browser.close();
  fs.rmSync(videoDirectory, { recursive: true, force: true });
  console.log(
    `GroundSignal screenshots and demo recording saved in ${outputDirectory}`,
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
