import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendEmailNotification, generateLeaveNotificationEmail, generatePermissionNotificationEmail } from "./email";
import { getNotificationEmailsServer } from "./supabaseServerClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Email notification endpoints
  app.post("/api/send-leave-notification", async (req, res) => {
    try {
      const { employeeName, leaveType, startDate, endDate, reason } = req.body;

      // Resolve recipients server-side using Supabase service role (or fall back to ADMIN_EMAIL)
      const { adminEmails, hrEmails } = await getNotificationEmailsServer();
      let recipients = [...(hrEmails || []), ...(adminEmails || [])];

      // Allow a temporary override via FORCE_NOTIFICATION_EMAILS env var
      // e.g. FORCE_NOTIFICATION_EMAILS="E0048-durgadevi@ctint.in,E0053-naveen@ctint.in"
      if (process.env.FORCE_NOTIFICATION_EMAILS) {
        const forced = (process.env.FORCE_NOTIFICATION_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (forced.length > 0) {
          recipients = forced;
        }
      }

      const emailContent = generateLeaveNotificationEmail(employeeName, leaveType, startDate, endDate, reason);

      const sent = await sendEmailNotification({
        to: recipients,
        subject: `New Leave Application from ${employeeName}`,
        html: emailContent,
        type: 'leave'
      });

      res.json({ 
        success: sent, 
        message: sent ? `Notification sent to ${recipients.length || 0} recipient(s)` : "Failed to send notification"
      });
    } catch (error) {
      console.error('Error sending leave notification:', error);
      res.status(500).json({ success: false, message: "Error sending notification" });
    }
  });

  app.post("/api/send-permission-notification", async (req, res) => {
    try {
      const { employeeName, permissionType, startTime, endTime, reason } = req.body;

      // Resolve recipients server-side using Supabase service role (or fall back to ADMIN_EMAIL)
      const { adminEmails, hrEmails } = await getNotificationEmailsServer();
      let recipients = [...(hrEmails || []), ...(adminEmails || [])];

      // Allow a temporary override via FORCE_NOTIFICATION_EMAILS env var
      if (process.env.FORCE_NOTIFICATION_EMAILS) {
        const forced = (process.env.FORCE_NOTIFICATION_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (forced.length > 0) {
          recipients = forced;
        }
      }

      const emailContent = generatePermissionNotificationEmail(employeeName, permissionType, startTime, endTime, reason);

      const sent = await sendEmailNotification({
        to: recipients,
        subject: `New Permission Request from ${employeeName}`,
        html: emailContent,
        type: 'permission'
      });

      res.json({ 
        success: sent, 
        message: sent ? `Notification sent to ${recipients.length || 0} recipient(s)` : "Failed to send notification"
      });
    } catch (error) {
      console.error('Error sending permission notification:', error);
      res.status(500).json({ success: false, message: "Error sending notification" });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
