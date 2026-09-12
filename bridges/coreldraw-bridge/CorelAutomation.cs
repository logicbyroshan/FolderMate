using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace FolderMate.CorelBridge
{
    public static class CorelAutomation
    {
        [DllImport("ole32.dll", PreserveSig = false)]
        private static extern void CLSIDFromProgID([MarshalAs(UnmanagedType.LPWStr)] string lpszProgID, out Guid lpclsid);

        [DllImport("oleaut32.dll", PreserveSig = false)]
        private static extern void GetActiveObject(ref Guid rclsid, IntPtr pvReserved, [MarshalAs(UnmanagedType.IUnknown)] out object ppunk);

        private static object? GetActiveComObject(string progId)
        {
            try
            {
                CLSIDFromProgID(progId, out Guid clsid);
                GetActiveObject(ref clsid, IntPtr.Zero, out object obj);
                return obj;
            }
            catch
            {
                return null;
            }
        }

        public static void GetStatus()
        {
            dynamic? corelApp = null;

            try
            {
                corelApp = GetActiveComObject("CorelDRAW.Application");
            }
            catch (Exception ex)
            {
                Console.WriteLine(JsonSerializer.Serialize(new
                {
                    success = false,
                    error = $"COM Exception: {ex.Message}"
                }));
                return;
            }

            if (corelApp == null)
            {
                // CorelDRAW is not actively running
                Console.WriteLine(JsonSerializer.Serialize(new
                {
                    success = true,
                    isRunning = false,
                    message = "CorelDRAW is not currently running"
                }));
                return;
            }

            try
            {
                string version = "CorelDRAW";
                try
                {
                    version = (string)corelApp.Version;
                }
                catch { }

                dynamic? activeDoc = null;
                try
                {
                    activeDoc = corelApp.ActiveDocument;
                }
                catch { }

                if (activeDoc == null)
                {
                    Console.WriteLine(JsonSerializer.Serialize(new
                    {
                        success = true,
                        isRunning = true,
                        version,
                        hasActiveDocument = false,
                        activeDocument = (object?)null
                    }));
                    return;
                }

                string docTitle = "Untitled";
                string fullPath = "";
                bool isDirty = false;
                int pageCount = 1;

                try { docTitle = (string)activeDoc.Name; } catch { }
                try { fullPath = (string)activeDoc.FullFileName; } catch { }
                try { isDirty = (bool)activeDoc.Dirty; } catch { }
                try { pageCount = (int)activeDoc.Pages.Count; } catch { }

                var result = new
                {
                    success = true,
                    isRunning = true,
                    version,
                    hasActiveDocument = true,
                    activeDocument = new
                    {
                        title = docTitle,
                        fullPath,
                        isDirty,
                        pageCount
                    }
                };

                Console.WriteLine(JsonSerializer.Serialize(result));
            }
            finally
            {
                if (corelApp != null)
                {
                    try { Marshal.ReleaseComObject(corelApp); } catch { }
                }
            }
        }

        public static void SaveAsNewVersion(string targetPath)
        {
            dynamic? corelApp = null;
            try
            {
                corelApp = GetActiveComObject("CorelDRAW.Application");
            }
            catch
            {
                corelApp = null;
            }

            if (corelApp == null)
            {
                Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = "CorelDRAW is not running" }));
                return;
            }

            try
            {
                dynamic? activeDoc = corelApp.ActiveDocument;
                if (activeDoc == null)
                {
                    Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = "No active document open in CorelDRAW" }));
                    return;
                }

                string targetDir = Path.GetDirectoryName(targetPath) ?? "";
                if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                // Execute COM SaveAs
                activeDoc.SaveAs(targetPath);

                var result = new
                {
                    success = true,
                    savedPath = targetPath,
                    fileSizeBytes = File.Exists(targetPath) ? new FileInfo(targetPath).Length : 0,
                    savedAt = DateTime.UtcNow.ToString("o")
                };

                Console.WriteLine(JsonSerializer.Serialize(result));
            }
            catch (Exception ex)
            {
                Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = $"SaveAs failed: {ex.Message}" }));
            }
            finally
            {
                if (corelApp != null)
                {
                    try { Marshal.ReleaseComObject(corelApp); } catch { }
                }
            }
        }
    }
}
