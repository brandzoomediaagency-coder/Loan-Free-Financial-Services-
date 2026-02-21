$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server started on http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.RawUrl.TrimStart('/').Split('?')[0]
        if ($path -eq "" -or $path -eq "/") { $path = "index.html" }
        
        $filePath = Join-Path (Get-Location) $path
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Simple extension-based content type mapping
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($extension) {
                ".html" { "text/html" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif"  { "image/gif" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errorMessage = "404 Not Found: $path"
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
        }
        $response.Close()
    } catch {
        Write-Host "Error: $_"
    }
}
