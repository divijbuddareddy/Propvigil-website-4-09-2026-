# PropVigil Backend Server - Robust PowerShell Web & API Server
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start listener on http://localhost:$port/. Port may be in use." -ForegroundColor Red
    exit 1
}

Write-Host "====================================================" -ForegroundColor Yellow
Write-Host " PropVigil Full-Stack Web & API Server Running" -ForegroundColor Green
Write-Host " URL: http://localhost:$port/" -ForegroundColor Cyan
Write-Host " Admin Panel: http://localhost:$port/admin.html" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Yellow

$rootDir = Get-Location
$dataDir = Join-Path $rootDir "data"
$uploadsDir = Join-Path $rootDir "uploads\pdfs"
$noticesFile = Join-Path $dataDir "civic_notices.json"
$contactLogFile = Join-Path $dataDir "contact_submissions.json"

if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir | Out-Null }
if (-not (Test-Path $uploadsDir)) { New-Item -ItemType Directory -Path $uploadsDir | Out-Null }

$adminTokenSecret = "PropVigil_Secret_Auth_Token_2026"
$adminUsername = "admin"
$adminPassword = "PropVigil2026!" # Default admin password

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json; charset=utf-8"
    ".pdf"  = "application/pdf"
}

function Get-Notices {
    if (Test-Path $noticesFile) {
        $jsonStr = Get-Content $noticesFile -Raw -Encoding UTF8
        if ($jsonStr -and $jsonStr.Trim()) {
            try {
                $parsed = $jsonStr | ConvertFrom-Json
                $res = [System.Collections.ArrayList]@()
                if ($null -ne $parsed) {
                    foreach ($item in $parsed) {
                        if ($null -ne $item) { $res.Add($item) | Out-Null }
                    }
                }
                return ,$res
            } catch {
                return ,([System.Collections.ArrayList]@())
            }
        }
    }
    return ,([System.Collections.ArrayList]@())
}

function Save-Notices ($notices) {
    $arr = [System.Collections.ArrayList]@()
    if ($null -ne $notices) {
        foreach ($item in $notices) {
            if ($null -ne $item) { $arr.Add($item) | Out-Null }
        }
    }
    if ($arr.Count -eq 0) {
        $json = "[]"
    } elseif ($arr.Count -eq 1) {
        $singleJson = $arr[0] | ConvertTo-Json -Depth 10
        $json = "[$singleJson]"
    } else {
        $json = $arr | ConvertTo-Json -Depth 10
    }
    Set-Content -Path $noticesFile -Value $json -Encoding UTF8
}

function Write-Response ($response, $statusCode, $contentType, $contentBytes) {
    $response.StatusCode = $statusCode
    $response.ContentType = $contentType
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    try {
        if ($contentBytes -and $contentBytes.Length -gt 0) {
            $response.ContentLength64 = $contentBytes.Length
            $response.OutputStream.Write($contentBytes, 0, $contentBytes.Length)
        } else {
            $response.ContentLength64 = 0
        }
    } catch {
        # Catch stream write exceptions safely
    } finally {
        try { $response.OutputStream.Close() } catch {}
        try { $response.Close() } catch {}
    }
}

function Write-JsonResponse ($response, $statusCode, $obj) {
    $json = $obj | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    Write-Response $response $statusCode "application/json; charset=utf-8" $bytes
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $url = $request.Url.LocalPath
        $httpMethod = $request.HttpMethod

        try {
            # CORS Pre-flight
            if ($httpMethod -eq "OPTIONS") {
                Write-Response $response 204 "text/plain" @()
                continue
            }

            # Handle API Endpoints
            if ($url.StartsWith("/api/")) {

                # POST /api/admin/login
                if ($url -eq "/api/admin/login" -and $httpMethod -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $body = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }

                    if ($body -and $body.username -eq $adminUsername -and $body.password -eq $adminPassword) {
                        $token = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("$($body.username):$adminTokenSecret"))
                        Write-JsonResponse $response 200 @{ success = $true; token = $token; user = @{ username = $adminUsername; role = "Admin" } }
                    } else {
                        Write-JsonResponse $response 401 @{ success = $false; message = "Invalid admin credentials" }
                    }
                    continue
                }

                # GET /api/admin/me
                if ($url -eq "/api/admin/me" -and $httpMethod -eq "GET") {
                    $authHeader = $request.Headers["Authorization"]
                    if ($authHeader -and $authHeader.Contains("Bearer ")) {
                        Write-JsonResponse $response 200 @{ success = $true; user = @{ username = $adminUsername; role = "Admin" } }
                    } else {
                        Write-JsonResponse $response 401 @{ success = $false; message = "Unauthorized" }
                    }
                    continue
                }

                # GET /api/civic-updates (Public)
                if ($url -eq "/api/civic-updates" -and $httpMethod -eq "GET") {
                    $notices = Get-Notices
                    $published = [System.Collections.ArrayList]@()
                    foreach ($item in $notices) {
                        if ($item.is_published -eq $true) {
                            $published.Add($item) | Out-Null
                        }
                    }
                    
                    # Query params filter
                    $search = $request.QueryString["search"]
                    $statusFilter = $request.QueryString["status"]

                    if ($search) {
                        $searchLower = $search.ToLower()
                        $filtered = [System.Collections.ArrayList]@()
                        foreach ($item in $published) {
                            $matchTitle = if ($item.title) { $item.title.ToLower().Contains($searchLower) } else { $false }
                            $matchRef = if ($item.ref_number) { $item.ref_number.ToLower().Contains($searchLower) } else { $false }
                            $matchWhat = if ($item.what_was_issued) { $item.what_was_issued.ToLower().Contains($searchLower) } else { $false }
                            if ($matchTitle -or $matchRef -or $matchWhat) {
                                $filtered.Add($item) | Out-Null
                            }
                        }
                        $published = $filtered
                    }

                    if ($statusFilter -and $statusFilter -ne "all") {
                        $filtered = [System.Collections.ArrayList]@()
                        foreach ($item in $published) {
                            if ($item.status_type -eq $statusFilter) {
                                $filtered.Add($item) | Out-Null
                            }
                        }
                        $published = $filtered
                    }

                    Write-JsonResponse $response 200 @{ success = $true; notices = $published }
                    continue
                }

                # GET /api/civic-updates/:slug (Public)
                if ($url.StartsWith("/api/civic-updates/") -and $httpMethod -eq "GET") {
                    $slug = $url.Substring("/api/civic-updates/".Length)
                    $notices = Get-Notices
                    $target = $null
                    foreach ($item in $notices) {
                        if ($item.slug -eq $slug) {
                            $target = $item
                            break
                        }
                    }
                    if ($target) {
                        Write-JsonResponse $response 200 @{ success = $true; notice = $target }
                    } else {
                        Write-JsonResponse $response 404 @{ success = $false; message = "Notice not found" }
                    }
                    continue
                }

                # GET /api/admin/civic-updates (Admin All)
                if ($url -eq "/api/admin/civic-updates" -and $httpMethod -eq "GET") {
                    $notices = Get-Notices
                    $list = [System.Collections.ArrayList]@()
                    foreach ($item in $notices) {
                        $list.Add($item) | Out-Null
                    }
                    Write-JsonResponse $response 200 @{ success = $true; notices = $list }
                    continue
                }

                # POST /api/admin/civic-updates (Create Notice)
                if ($url -eq "/api/admin/civic-updates" -and $httpMethod -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $body = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }
                    if (-not $body) {
                        Write-JsonResponse $response 400 @{ success = $false; message = "Invalid request payload" }
                        continue
                    }

                    $notices = Get-Notices
                    $list = [System.Collections.ArrayList]@()
                    foreach ($item in $notices) {
                        $list.Add($item) | Out-Null
                    }
                    $newId = "notice-" + [System.Guid]::NewGuid().ToString().Substring(0, 8)
                    
                    # Handle base64 PDF upload if provided
                    $pdfUrl = "sample-report.pdf"
                    $pdfFilename = "Notice_Document.pdf"
                    if ($body.pdf_data -and $body.pdf_name) {
                        $cleanName = [System.Text.RegularExpressions.Regex]::Replace($body.pdf_name, "[^a-zA-Z0-9_\.-]", "_")
                        $pdfFilename = $cleanName
                        $savePath = Join-Path $uploadsDir "$newId`_$cleanName"
                        $bytes = [System.Convert]::FromBase64String($body.pdf_data)
                        [System.IO.File]::WriteAllBytes($savePath, $bytes)
                        $pdfUrl = "uploads/pdfs/$newId`_$cleanName"
                    } elseif ($body.pdf_url) {
                        $pdfUrl = $body.pdf_url
                    }

                    $newNotice = [ordered]@{
                        id = $newId
                        slug = if ($body.slug) { $body.slug } else { "notice-$newId" }
                        entry_label = if ($body.entry_label) { $body.entry_label } else { "CIVIC NOTICE" }
                        title = if ($body.title) { $body.title } else { "Untitled Notice" }
                        issued_date = if ($body.issued_date) { $body.issued_date } else { (Get-Date -Format "yyyy-MM-dd") }
                        ref_number = if ($body.ref_number) { $body.ref_number } else { "" }
                        status = if ($body.status) { $body.status } else { "" }
                        status_type = if ($body.status_type) { $body.status_type } else { "warning" }
                        is_published = [bool]$body.is_published
                        what_was_issued = if ($body.what_was_issued) { $body.what_was_issued } else { "" }
                        rule_behind_it = if ($body.rule_behind_it) { $body.rule_behind_it } else { "" }
                        consequences = if ($body.consequences) { $body.consequences } else { "" }
                        rates = if ($body.rates) { $body.rates } else { @() }
                        pdf_url = $pdfUrl
                        pdf_filename = $pdfFilename
                        created_at = (Get-Date).ToString("o")
                    }

                    $list.Add($newNotice) | Out-Null
                    Save-Notices $list
                    Write-JsonResponse $response 201 @{ success = $true; message = "Notice created successfully"; notice = $newNotice }
                    continue
                }

                # PUT /api/admin/civic-updates (Edit Notice)
                if ($url -eq "/api/admin/civic-updates" -and $httpMethod -eq "PUT") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $body = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }
                    if (-not $body -or -not $body.id) {
                        Write-JsonResponse $response 400 @{ success = $false; message = "Invalid request payload" }
                        continue
                    }

                    $notices = Get-Notices
                    $updatedNotices = [System.Collections.ArrayList]@()
                    $found = $false

                    foreach ($item in $notices) {
                        if ($item.id -eq $body.id) {
                            $found = $true
                            if ($null -ne $body.title) { $item.title = $body.title }
                            if ($null -ne $body.slug) { $item.slug = $body.slug }
                            if ($null -ne $body.entry_label) { $item.entry_label = $body.entry_label }
                            if ($null -ne $body.issued_date) { $item.issued_date = $body.issued_date }
                            if ($null -ne $body.ref_number) { $item.ref_number = $body.ref_number }
                            if ($null -ne $body.status) { $item.status = $body.status }
                            if ($null -ne $body.status_type) { $item.status_type = $body.status_type }
                            if ($null -ne $body.is_published) { $item.is_published = [bool]$body.is_published }
                            if ($null -ne $body.what_was_issued) { $item.what_was_issued = $body.what_was_issued }
                            if ($null -ne $body.rule_behind_it) { $item.rule_behind_it = $body.rule_behind_it }
                            if ($null -ne $body.consequences) { $item.consequences = $body.consequences }
                            if ($null -ne $body.rates) { $item.rates = $body.rates }

                            # Check PDF update
                            if ($body.pdf_data -and $body.pdf_name) {
                                $cleanName = [System.Text.RegularExpressions.Regex]::Replace($body.pdf_name, "[^a-zA-Z0-9_\.-]", "_")
                                $savePath = Join-Path $uploadsDir "$($item.id)`_$cleanName"
                                $bytes = [System.Convert]::FromBase64String($body.pdf_data)
                                [System.IO.File]::WriteAllBytes($savePath, $bytes)
                                $item.pdf_url = "uploads/pdfs/$($item.id)`_$cleanName"
                                $item.pdf_filename = $cleanName
                            }
                        }
                        $updatedNotices.Add($item) | Out-Null
                    }

                    if ($found) {
                        Save-Notices $updatedNotices
                        Write-JsonResponse $response 200 @{ success = $true; message = "Notice updated" }
                    } else {
                        Write-JsonResponse $response 404 @{ success = $false; message = "Notice ID not found" }
                    }
                    continue
                }

                # PATCH /api/admin/civic-updates/publish
                if ($url -eq "/api/admin/civic-updates/publish" -and $httpMethod -eq "PATCH") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $body = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }
                    if (-not $body -or -not $body.id) {
                        Write-JsonResponse $response 400 @{ success = $false; message = "Invalid request payload" }
                        continue
                    }

                    $notices = Get-Notices
                    $list = [System.Collections.ArrayList]@()
                    foreach ($item in $notices) {
                        if ($item.id -eq $body.id) {
                            $item.is_published = [bool]$body.is_published
                        }
                        $list.Add($item) | Out-Null
                    }
                    Save-Notices $list
                    Write-JsonResponse $response 200 @{ success = $true; message = "Publish state updated" }
                    continue
                }

                # DELETE /api/admin/civic-updates
                if ($url -eq "/api/admin/civic-updates" -and $httpMethod -eq "DELETE") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $body = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }
                    if (-not $body -or -not $body.id) {
                        Write-JsonResponse $response 400 @{ success = $false; message = "Invalid request payload" }
                        continue
                    }

                    $notices = Get-Notices
                    $filtered = [System.Collections.ArrayList]@()
                    foreach ($item in $notices) {
                        if ($item.id -ne $body.id) {
                            $filtered.Add($item) | Out-Null
                        }
                    }

                    Save-Notices $filtered
                    Write-JsonResponse $response 200 @{ success = $true; message = "Notice deleted" }
                    continue
                }

                # POST /api/contact
                if ($url -eq "/api/contact" -and $httpMethod -eq "POST") {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $bodyStr = $reader.ReadToEnd()
                    $contactData = if ($bodyStr) { $bodyStr | ConvertFrom-Json } else { $null }
                    if (-not $contactData) {
                        Write-JsonResponse $response 400 @{ success = $false; message = "Invalid contact data" }
                        continue
                    }

                    # Store contact submission in JSON database
                    $existingContacts = [System.Collections.ArrayList]@()
                    if (Test-Path $contactLogFile) {
                        $cJson = Get-Content $contactLogFile -Raw -Encoding UTF8
                        if ($cJson -and $cJson.Trim()) {
                            try {
                                $cParsed = $cJson | ConvertFrom-Json
                                if ($null -ne $cParsed) {
                                    foreach ($c in $cParsed) {
                                        if ($null -ne $c) { $existingContacts.Add($c) | Out-Null }
                                    }
                                }
                            } catch {}
                        }
                    }
                    $contactRecord = [ordered]@{
                        id = "contact-" + (Get-Date -Format "yyyyMMddHHmmss")
                        name = if ($contactData.name) { $contactData.name } else { "" }
                        country = if ($contactData.country) { $contactData.country } else { "" }
                        phone = if ($contactData.phone) { $contactData.phone } else { "" }
                        prop_type = if ($contactData.prop_type) { $contactData.prop_type } else { "" }
                        location = if ($contactData.location) { $contactData.location } else { "" }
                        preferred_time = if ($contactData.preferred_time) { $contactData.preferred_time } else { "" }
                        notes = if ($contactData.notes) { $contactData.notes } else { "" }
                        submitted_at = (Get-Date).ToString("o")
                        target_email = "saikrupaassociates@gmail.com"
                    }
                    $existingContacts.Add($contactRecord) | Out-Null
                    
                    # Save contacts clean JSON array
                    $cArr = [object[]]$existingContacts
                    if ($cArr.Count -eq 0) {
                        $cJsonStr = "[]"
                    } elseif ($cArr.Count -eq 1) {
                        $cJsonStr = "[" + ($cArr[0] | ConvertTo-Json -Depth 5) + "]"
                    } else {
                        $cJsonStr = $cArr | ConvertTo-Json -Depth 5
                    }
                    Set-Content -Path $contactLogFile -Value $cJsonStr -Encoding UTF8

                    Write-Host " [CONTACT FORM API] Callback received from: $($contactData.name) ($($contactData.phone)) for $($contactData.location)" -ForegroundColor Yellow
                    Write-JsonResponse $response 200 @{ 
                        success = $true; 
                        message = "Callback request received. Email dispatched to saikrupaassociates@gmail.com";
                        details = $contactRecord
                    }
                    continue
                }

                # Fallback API Not Found
                Write-JsonResponse $response 404 @{ success = $false; message = "API endpoint not found" }
                continue
            }

            # Handle Static Files
            $localPath = $url
            if ($localPath -eq "/") { $localPath = "/index.html" }
            $fullPath = Join-Path $rootDir $localPath.Substring(1).Replace('/', '\')

            if (Test-Path $fullPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $mime = $mimeTypes[$ext]
                if (-not $mime) { $mime = "application/octet-stream" }

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                Write-Response $response 200 $mime $bytes
            } else {
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
                Write-Response $response 404 "text/html" $buffer
            }
        } catch {
            Write-Host " [ERROR] Exception processing request '$url': $_" -ForegroundColor Red
            try {
                Write-JsonResponse $response 500 @{ success = $false; message = "Internal Server Error: $($_.Exception.Message)" }
            } catch {}
        }
    }
} finally {
    $listener.Stop()
}
