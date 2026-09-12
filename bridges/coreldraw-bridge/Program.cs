using System;
using System.Text.Json;

namespace FolderMate.CorelBridge
{
    class Program
    {
        [STAThread]
        static int Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine(JsonSerializer.Serialize(new
                {
                    success = false,
                    error = "No command provided. Supported commands: status, save-as, inspect-cdr, extract-thumbnail"
                }));
                return 1;
            }

            string command = args[0].ToLowerInvariant().TrimStart('-');

            try
            {
                switch (command)
                {
                    case "status":
                        CorelAutomation.GetStatus();
                        return 0;

                    case "save-as":
                    case "save-as-new-version":
                        if (args.Length < 2)
                        {
                            Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = "Target path required for save-as" }));
                            return 1;
                        }
                        CorelAutomation.SaveAsNewVersion(args[1]);
                        return 0;

                    case "inspect-cdr":
                        if (args.Length < 2)
                        {
                            Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = "File path required for inspect-cdr" }));
                            return 1;
                        }
                        ZipInspector.InspectCdr(args[1]);
                        return 0;

                    case "extract-thumbnail":
                        if (args.Length < 3)
                        {
                            Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = "Usage: extract-thumbnail <sourceCdr> <targetPng>" }));
                            return 1;
                        }
                        ZipInspector.ExtractThumbnail(args[1], args[2]);
                        return 0;

                    default:
                        Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = $"Unknown command: {command}" }));
                        return 1;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(JsonSerializer.Serialize(new
                {
                    success = false,
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                }));
                return 1;
            }
        }
    }
}
