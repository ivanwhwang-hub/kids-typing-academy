# Kids Typing Academy — Installation Guide

Welcome! This guide will walk you through downloading the app from GitHub and running it on your own PC or Mac — no internet required after setup.

---

## Step 1 — Find the App on GitHub

1. Open any web browser (Chrome, Safari, Edge, Firefox).
2. Go to: **https://github.com/ivanwhwang-hub/kids-typing-academy**
3. You should see a page with all the app's files listed.

---

## Step 2 — Download the App

1. On the GitHub page, click the green **"Code"** button near the top right.
2. In the dropdown that appears, click **"Download ZIP"**.
3. A file called `kids-typing-academy-main.zip` will download to your computer.
4. Find the ZIP file (usually in your **Downloads** folder) and **double-click** it to unzip it.
   - On **Mac**: it unzips automatically into a folder.
   - On **Windows**: right-click → "Extract All", then click "Extract".
5. You should now have a folder called `kids-typing-academy-main`.

---

## Step 3 — Install Node.js (one-time setup)

The app is built with modern web technology that requires **Node.js** to run. You only need to do this once.

1. Go to: **https://nodejs.org**
2. Click the big **"LTS"** download button (the recommended version).
3. Run the installer and follow the steps — just keep clicking "Next" / "Continue".
4. When it finishes, Node.js is installed.

**To check it worked:**
- On **Mac**: Open **Terminal** (search for it in Spotlight with ⌘+Space).
- On **Windows**: Open **Command Prompt** (search "cmd" in the Start menu).
- Type `node --version` and press Enter. You should see a version number like `v20.x.x`.

---

## Step 4 — Install the App's Dependencies

1. Open **Terminal** (Mac) or **Command Prompt** (Windows).
2. Navigate into the app folder you unzipped. Type the following and press Enter — replace the path with where your folder actually is:

   **Mac:**
   ```
   cd ~/Downloads/kids-typing-academy-main
   ```

   **Windows:**
   ```
   cd C:\Users\YourName\Downloads\kids-typing-academy-main
   ```

3. Now install the app's packages by typing:
   ```
   npm install
   ```
   Press Enter and wait. It will download some files — this may take 1–2 minutes.

---

## Step 5 — Start the App

1. Still in the same Terminal / Command Prompt window, navigate into the app's folder:

   ```
   cd artifacts/kids-typing-academy
   ```

2. Type:
   ```
   npm run dev
   ```
   Press Enter.

3. You will see some text appear, including a line like:
   ```
   ➜  Local:   http://localhost:5173/
   ```

4. **Open your browser** and go to: **http://localhost:5173**

The Kids Typing Academy app will open and is ready to use! 🎉

---

## Stopping the App

When you are done, go back to the Terminal / Command Prompt window and press **Ctrl + C** to stop the app.

---

## Running It Again Later

You don't need to install anything again. Just:

1. Open Terminal / Command Prompt.
2. Navigate to the folder:
   ```
   cd ~/Downloads/kids-typing-academy-main/artifacts/kids-typing-academy
   ```
3. Type `npm run dev` and open **http://localhost:5173** in your browser.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `node` command not found | Re-install Node.js from https://nodejs.org and restart your Terminal |
| `npm install` fails | Make sure you are inside the `kids-typing-academy-main` folder |
| Browser shows a blank page | Wait a few seconds and refresh — the app may still be starting |
| Port 5173 already in use | Close other browser tabs or apps using that port, then try again |

---

## What Is Stored on Your Computer?

All child profiles, progress, badges, and scores are saved in your **browser's local storage** — nothing is sent to the internet. Data stays on your machine and in the browser you use to open the app.

---

*Built with React + Vite. Requires Node.js 18 or higher.*
