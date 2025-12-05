# VOIS Employee Onboarding Automation

This project automates the employee onboarding workflow using AWS Lambda and UiPath. It retrieves employee data, assigns priority, queues them in Orchestrator, processes high-priority employees through a web form, generates QR codes, and produces a final report with email notification.

## Components
* **index.js** – AWS Lambda function that fetches employee data, assigns priority (High/Normal/Low), and pushes items into the **New Hires** Orchestrator queue.
* **Main.xaml** – Entry point for the UiPath process.
* **WebForm.xaml** – Enters employee data into `https://rpachallenge.com/` for High Priority items.
* **GenerateQRCode.xaml** – Generates and downloads employee QR codes from `https://www.the-qrcode-generator.com/`.
* **QRCodes/** – Folder where QR code PNG files are saved.

## Output

* QR code files saved in the `QRCodes` folder
* Excel report `Onboarding_Report_<Date>.xlsx`
* Email to `manager@example.com` with report and zipped QR codes attached

## How to Run
### UiPath Project

1. Open `Main.xaml` in UiPath Studio
2. Ensure the queue **New Hires** exists in Orchestrator in the **Shared** folder
3. Ensure the `QRCodes` folder is present
4. Run the automation or publish it to UiPath Orchestrator
