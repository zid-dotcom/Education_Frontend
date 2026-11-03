using System;
using System.Drawing;
using System.Drawing.Imaging;

public class BgRemover {
    public static void Process(string inputPath, string outputPath, int threshold) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int w = src.Width;
            int h = src.Height;
            using (Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData dstData = dst.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int stride = Math.Abs(srcData.Stride);
                int bytes = stride * h;
                byte[] buffer = new byte[bytes];
                System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, buffer, 0, bytes);

                bool[] isBg = new bool[w * h];
                int[] q = new int[w * h * 2];
                int head = 0, tail = 0;

                bool IsWhite(int x, int y) {
                    int idx = (y * stride) + (x * 4);
                    int b = buffer[idx];
                    int g = buffer[idx + 1];
                    int r = buffer[idx + 2];
                    int min = Math.Min(r, Math.Min(g, b));
                    int max = Math.Max(r, Math.Max(g, b));
                    return min >= threshold && (max - min) <= 24;
                }

                for (int x = 0; x < w; x++) {
                    if (IsWhite(x, 0)) { isBg[x] = true; q[tail++] = (0 << 16) | x; }
                    if (IsWhite(x, h - 1)) { isBg[(h - 1) * w + x] = true; q[tail++] = ((h - 1) << 16) | x; }
                }
                for (int y = 0; y < h; y++) {
                    if (IsWhite(0, y) && !isBg[y * w]) { isBg[y * w] = true; q[tail++] = (y << 16) | 0; }
                    if (IsWhite(w - 1, y) && !isBg[y * w + w - 1]) { isBg[y * w + w - 1] = true; q[tail++] = (y << 16) | (w - 1); }
                }

                int[] dx = { 1, -1, 0, 0 };
                int[] dy = { 0, 0, 1, -1 };

                while (head < tail) {
                    int val = q[head++];
                    int cx = val & 0xFFFF;
                    int cy = val >> 16;

                    for (int i = 0; i < 4; i++) {
                        int nx = cx + dx[i];
                        int ny = cy + dy[i];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            int npos = ny * w + nx;
                            if (!isBg[npos] && IsWhite(nx, ny)) {
                                isBg[npos] = true;
                                q[tail++] = (ny << 16) | nx;
                            }
                        }
                    }
                }

                // Set transparent for bg, and soft edge for 1px boundary
                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int pos = y * w + x;
                        int idx = (y * stride) + (x * 4);
                        if (isBg[pos]) {
                            buffer[idx + 3] = 0;
                        } else {
                            int b = buffer[idx];
                            int g = buffer[idx + 1];
                            int r = buffer[idx + 2];
                            int min = Math.Min(r, Math.Min(g, b));
                            if (min >= 230) {
                                bool nearBg = (x > 0 && isBg[pos - 1]) ||
                                              (x < w - 1 && isBg[pos + 1]) ||
                                              (y > 0 && isBg[pos - w]) ||
                                              (y < h - 1 && isBg[pos + w]);
                                if (nearBg) {
                                    int a = (int)((255 - min) / 25.0 * 255);
                                    if (a < 0) a = 0;
                                    if (a > 255) a = 255;
                                    buffer[idx + 3] = (byte)a;
                                }
                            }
                        }
                    }
                }

                System.Runtime.InteropServices.Marshal.Copy(buffer, 0, dstData.Scan0, bytes);
                src.UnlockBits(srcData);
                dst.UnlockBits(dstData);

                dst.Save(outputPath, ImageFormat.Png);
                Console.WriteLine("Saved: " + outputPath);
            }
        }
    }
}

