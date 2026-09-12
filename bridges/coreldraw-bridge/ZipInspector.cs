using System;
using System.IO;
using System.IO.Compression;
using System.Text.Json;
using System.Xml.Linq;

namespace FolderMate.CorelBridge
{
    public static class ZipInspector
    {
        public static void InspectCdr(string filePath)
        {
            if (!File.Exists(filePath))
            {
                OutputError($"File not found: {filePath}");
                return;
            }

            try
            {
                using var archive = ZipFile.OpenRead(filePath);
                string title = Path.GetFileNameWithoutExtension(filePath);
                string keywords = "";
                string creator = "CorelDRAW";
                int pageCount = 1;
                bool hasThumbnail = false;

                // Inspect metadata.xml if present
                var metaEntry = archive.GetEntry("metadata.xml") ?? archive.GetEntry("Metadata.xml");
                if (metaEntry != null)
                {
                    using var stream = metaEntry.Open();
                    var xdoc = XDocument.Load(stream);
                    var titleEl = xdoc.Descendants("title").FirstOrDefault() ?? xdoc.Descendants("Title").FirstOrDefault();
                    if (titleEl != null && !string.IsNullOrWhiteSpace(titleEl.Value))
                    {
                        title = titleEl.Value;
                    }

                    var keywordsEl = xdoc.Descendants("keywords").FirstOrDefault() ?? xdoc.Descendants("Keywords").FirstOrDefault();
                    if (keywordsEl != null)
                    {
                        keywords = keywordsEl.Value;
                    }

                    var creatorEl = xdoc.Descendants("creator").FirstOrDefault() ?? xdoc.Descendants("Creator").FirstOrDefault();
                    if (creatorEl != null)
                    {
                        creator = creatorEl.Value;
                    }
                }

                // Check thumbnail entry
                var thumbEntry = archive.GetEntry("previews/thumbnail.png") ?? archive.GetEntry("previews/thumbnail.bmp");
                if (thumbEntry != null)
                {
                    hasThumbnail = true;
                }

                var result = new
                {
                    success = true,
                    isCdrPackage = true,
                    filePath,
                    fileSizeBytes = new FileInfo(filePath).Length,
                    title,
                    keywords,
                    creator,
                    pageCount,
                    hasThumbnail,
                    inspectedAt = DateTime.UtcNow.ToString("o")
                };

                Console.WriteLine(JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = false }));
            }
            catch (InvalidDataException)
            {
                // Not a zip format (e.g. legacy CorelDRAW v12 or earlier binary CDR)
                var result = new
                {
                    success = true,
                    isCdrPackage = false,
                    filePath,
                    fileSizeBytes = new FileInfo(filePath).Length,
                    title = Path.GetFileNameWithoutExtension(filePath),
                    creator = "CorelDRAW Legacy Binary",
                    pageCount = 1,
                    hasThumbnail = false,
                    inspectedAt = DateTime.UtcNow.ToString("o")
                };
                Console.WriteLine(JsonSerializer.Serialize(result));
            }
            catch (Exception ex)
            {
                OutputError($"Failed to inspect CDR file: {ex.Message}");
            }
        }

        public static void ExtractThumbnail(string cdrPath, string outPngPath)
        {
            if (!File.Exists(cdrPath))
            {
                OutputError($"Source CDR not found: {cdrPath}");
                return;
            }

            try
            {
                using var archive = ZipFile.OpenRead(cdrPath);
                var thumbEntry = archive.GetEntry("previews/thumbnail.png") ?? archive.GetEntry("previews/thumbnail.bmp");
                if (thumbEntry == null)
                {
                    OutputError("No embedded thumbnail found in CDR package");
                    return;
                }

                string outDir = Path.GetDirectoryName(outPngPath) ?? "";
                if (!string.IsNullOrEmpty(outDir) && !Directory.Exists(outDir))
                {
                    Directory.CreateDirectory(outDir);
                }

                thumbEntry.ExtractToFile(outPngPath, overwrite: true);

                var result = new
                {
                    success = true,
                    sourceCdr = cdrPath,
                    extractedThumbnail = outPngPath,
                    fileSizeBytes = new FileInfo(outPngPath).Length
                };
                Console.WriteLine(JsonSerializer.Serialize(result));
            }
            catch (Exception ex)
            {
                OutputError($"Failed to extract thumbnail: {ex.Message}");
            }
        }

        private static void OutputError(string message)
        {
            Console.WriteLine(JsonSerializer.Serialize(new { success = false, error = message }));
        }
    }
}
