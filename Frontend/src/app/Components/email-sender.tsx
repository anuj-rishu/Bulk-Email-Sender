"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Upload, Mail, Linkedin } from "lucide-react";
import Papa from "papaparse";
import axios from "axios";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';

export default function EmailSender() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setCsvFile(file);
        setFileName(file.name);
    }
  };

  const handleUpload = () => {
    if (!csvFile || !subject || !body) {
      toast.error("Please upload a CSV file and fill in the subject and body.");
      return;
    }

    setIsSending(true);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const userData = result.data;
        sendDataToBackend(userData);
      },
    });
  };

  const sendDataToBackend = (userData: unknown[]) => {
    axios
      .post("https://bulk-email-sender-ecru.vercel.app/api/send-emails", {
        users: userData,
        subject,
        body,
      })
      .then(() => {
        toast.success("Emails sent successfully!");
      })
      .catch((error) => {
        console.error("Error sending emails:", error);
        toast.error("Failed to send emails");
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 font-sans">
      <Toaster />
      <div className="absolute inset-0 bg-white opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <header className="w-full text-center py-6">
        <h1 className="text-4xl font-bold text-white shadow-text">
          Bulk Email Sender
        </h1>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex-grow"
      >
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Email Sender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="csv-upload"
                  className="text-sm font-medium text-gray-700"
                >
                  Upload CSV
                </Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors duration-300">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="csv-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV up to 10MB</p>
                  </div>
                </div>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {fileName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="subject"
                  className="text-sm font-medium text-gray-700"
                >
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="body"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Body
                </Label>
                <Textarea
                  id="body"
                  placeholder="Enter email body"
                  rows={4}
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleUpload}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Email
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      <footer className="w-full text-center py-4 mt-4">
        <p className="text-white text-sm">
          Crafted by Anuj Rishu Tiwari
        </p>
        <Link 
          href="https://www.linkedin.com/in/anuj-rishu-tiwari" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-white hover:text-indigo-200 transition-colors duration-200 mt-2"
        >
          <Linkedin className="w-4 h-4 mr-2" />
          <span>Anuj Rishu Tiwari</span>
        </Link>
      </footer>
    </div>
  );
}