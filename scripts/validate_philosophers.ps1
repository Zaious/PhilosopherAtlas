Add-Type -AssemblyName Microsoft.VisualBasic
$philsDir = "P:\Project\PhiMaps\mnt\user-data\outputs\philosopher-atlas\data\philosophers"

$TRADITIONS = @("greek","chinese","indian","islamic","jewish","european","japanese","korean","african","latin_american","other")
$CENTRALITY = @("core","contested","adjacent")
$DATECERT   = @("exact","approximate","uncertain")
$ANCHORS    = @("birth","death","work","residence")
$SRCPROP    = @("P19","P20","P937","P551")
$POLSRC     = @("curated","historical-basemaps")
$SOURCEIDS  = @("wikidata","sep","iep","feng_youlan","lao_siguang","routledge_series","adamson")
$ENTRYTYPES = @("dedicated","topic","canon_list")
$required   = @("id","qid","name_zh","name_en","tradition","centrality","birth_year","date_certainty","active_regions","membership_sources","k")
$allowedTop = @("id","qid","slug","name_zh","name_en","tradition","centrality","review","birth_year","death_year","date_certainty","active_regions","membership_sources","works","works_sources","k","sitelinks","birth_place","description","bio","bio_source","description_en","bio_en","bio_en_source")
$allowedWork = @("title","title_zh","year","qid","source")
$allowedWS   = @("source","ref","note")
$allowedRegion = @("lat","lon","place","period","anchor","source_property","primary","polity_sequence","polity_source")

function Test-Simplified($s) {
    if (-not $s) { return $false }
    ([Microsoft.VisualBasic.Strings]::StrConv($s,[Microsoft.VisualBasic.VbStrConv]::TraditionalChinese,1028)) -ne $s
}

$errors = [System.Collections.Generic.List[string]]::new()
$files = Get-ChildItem -Path $philsDir -Filter "*.json"
foreach ($f in $files) {
    $p = Get-Content $f.FullName -Encoding UTF8 -Raw | ConvertFrom-Json
    $id = $p.qid
    foreach ($r in $required) { if ($null -eq $p.PSObject.Properties[$r]) { $errors.Add("$id missing required '$r'") } }
    foreach ($k in $p.PSObject.Properties.Name) { if ($allowedTop -notcontains $k) { $errors.Add("$id unexpected top-level field '$k'") } }
    if ($p.id -notmatch '^Q[0-9]+$') { $errors.Add("$id bad id pattern '$($p.id)'") }
    if ($f.BaseName -ne $p.qid)      { $errors.Add("$id filename != qid ($($f.BaseName))") }
    if ($TRADITIONS -notcontains $p.tradition) { $errors.Add("$id bad tradition '$($p.tradition)'") }
    if ($CENTRALITY -notcontains $p.centrality) { $errors.Add("$id bad centrality '$($p.centrality)'") }
    if ($DATECERT   -notcontains $p.date_certainty) { $errors.Add("$id bad date_certainty '$($p.date_certainty)'") }
    if ($p.k -lt 2) { $errors.Add("$id k<2 ($($p.k))") }
    if ($p.k -ge 2 -and $p.centrality -ne "core") { $errors.Add("$id k>=2 but centrality!=core") }
    if (($p.k -eq 2) -ne [bool]$p.review) { $errors.Add("$id review flag mismatch") }
    if (Test-Simplified $p.name_zh) { $errors.Add("$id SIMPLIFIED name_zh '$($p.name_zh)'") }

    # active_regions
    $ar = @($p.active_regions)
    if ($ar.Count -lt 1) { $errors.Add("$id active_regions empty") }
    $primaryCount = 0
    foreach ($rg in $ar) {
        foreach ($k in $rg.PSObject.Properties.Name) { if ($allowedRegion -notcontains $k) { $errors.Add("$id region unexpected field '$k'") } }
        if ($null -eq $rg.lat -or $rg.lat -lt -90 -or $rg.lat -gt 90) { $errors.Add("$id bad lat $($rg.lat)") }
        if ($null -eq $rg.lon -or $rg.lon -lt -180 -or $rg.lon -gt 180) { $errors.Add("$id bad lon $($rg.lon)") }
        if ($ANCHORS -notcontains $rg.anchor) { $errors.Add("$id bad anchor '$($rg.anchor)'") }
        if ($null -ne $rg.source_property -and $SRCPROP -notcontains $rg.source_property) { $errors.Add("$id bad source_property '$($rg.source_property)'") }
        if ($rg.primary) { $primaryCount++ }
        if ($null -ne $rg.polity_source -and $POLSRC -notcontains $rg.polity_source) { $errors.Add("$id bad polity_source '$($rg.polity_source)'") }
        $ps = @($rg.polity_sequence)
        if ($ps.Count -gt 0 -and -not $rg.polity_source) { $errors.Add("$id polity_sequence present but polity_source null") }
        foreach ($seg in $ps) {
            if (-not $seg.polity) { $errors.Add("$id polity segment missing name") }
            if ($null -ne $seg.start -and $null -ne $seg.end -and $seg.start -gt $seg.end) { $errors.Add("$id polity segment start>end ($($seg.polity))") }
        }
    }
    if ($primaryCount -ne 1) { $errors.Add("$id primary region count = $primaryCount (must be 1)") }

    # membership_sources
    $ms = @($p.membership_sources)
    if ($ms.Count -lt 1) { $errors.Add("$id membership_sources empty") }
    $wsum = 0.0
    foreach ($m in $ms) {
        if ($SOURCEIDS -notcontains $m.source_id) { $errors.Add("$id bad source_id '$($m.source_id)'") }
        if ($ENTRYTYPES -notcontains $m.entry_type) { $errors.Add("$id bad entry_type '$($m.entry_type)'") }
        if ($m.weight -lt 0 -or $m.weight -gt 1) { $errors.Add("$id bad weight $($m.weight)") }
        $wsum += $m.weight
    }
    if ([Math]::Abs($wsum - $p.k) -gt 0.01) { $errors.Add("$id k ($($p.k)) != sum(weights) ($wsum)") }

    # works (P800; must not affect k)
    foreach ($w in @($p.works)) {
        foreach ($k in $w.PSObject.Properties.Name) { if ($allowedWork -notcontains $k) { $errors.Add("$id work unexpected field '$k'") } }
        if (-not $w.title) { $errors.Add("$id work missing title") }
        if ($w.source -ne "wikidata") { $errors.Add("$id work bad source '$($w.source)'") }
    }
    foreach ($ws in @($p.works_sources)) {
        foreach ($k in $ws.PSObject.Properties.Name) { if ($allowedWS -notcontains $k) { $errors.Add("$id works_source unexpected field '$k'") } }
        if (@("wikidata","ctext") -notcontains $ws.source) { $errors.Add("$id works_source bad source '$($ws.source)'") }
    }
}

Write-Host "Validated $($files.Count) files against schema constraints"
Write-Host "Errors: $($errors.Count)"
if ($errors.Count -gt 0) { $errors | Select-Object -First 50 | ForEach-Object { Write-Host "  $_" } }
else { Write-Host "  ALL VALID" }
