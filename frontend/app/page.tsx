"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Download, Loader2, User, FileDown } from "lucide-react"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock OCR service
const performOCR = async (file: File, sector: Sector, persona: Persona): Promise<OcrResult> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Return sector-specific mock data
  return getMockDataForSector(sector, persona)
}

// Types
interface OcrField {
  name: string
  value: string
}

interface OcrResult {
  text: string
  fields: OcrField[]
}

type Persona = "Joe" | "John" | "Günther"
type Sector = "agriculture" | "powerplants" | "telecommunication"
type Mode = "upload" | "download"

// Get mock data based on sector and persona
const getMockDataForSector = (sector: Sector, persona: Persona): OcrResult => {
  let fields: OcrField[] = []
  const text =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

  // Sector-specific fields
  if (sector === "agriculture") {
    fields = [
      { name: "Crop Type", value: "Wheat" },
      { name: "Field Size", value: "120 acres" },
      { name: "Planting Date", value: "2023-03-15" },
      { name: "Expected Yield", value: "5.2 tons/acre" },
      { name: "Soil pH", value: "6.8" },
      { name: "Irrigation", value: "Drip system" },
    ]
  } else if (sector === "powerplants") {
    fields = [
      { name: "Plant ID", value: "PP-2023-0042" },
      { name: "Capacity", value: "250 MW" },
      { name: "Fuel Type", value: "Natural Gas" },
      { name: "Efficiency", value: "87%" },
      { name: "CO2 Emissions", value: "450 g/kWh" },
      { name: "Operational Since", value: "2015-06-22" },
    ]
  } else {
    // telecommunication
    fields = [
      { name: "Network Type", value: "5G" },
      { name: "Coverage Area", value: "Urban" },
      { name: "Bandwidth", value: "100 MHz" },
      { name: "Frequency", value: "3.5 GHz" },
      { name: "Latency", value: "4ms" },
      { name: "Users Capacity", value: "100,000" },
    ]
  }

  // Add persona-specific field
  if (persona === "Joe") {
    fields.push({ name: "Approved By", value: "Joe Smith" })
  } else if (persona === "John") {
    fields.push({ name: "Reviewed By", value: "John Davis" })
  } else {
    // Günther
    fields.push({ name: "Certified By", value: "Günther Mueller" })
  }

  return { text, fields }
}

export default function OcrPhotoAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [persona, setPersona] = useState<Persona>("Joe")
  const [sector, setSector] = useState<Sector>("agriculture")
  const [mode, setMode] = useState<Mode>("upload")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)

      // Reset results when new file is selected
      setResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsAnalyzing(true)
    try {
      const ocrResult = await performOCR(file, sector, persona)
      setResult(ocrResult)
    } catch (error) {
      console.error("OCR analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadExcel = () => {
    // If we have results, use them; otherwise, generate template data based on sector and persona
    const dataToUse = result || getMockDataForSector(sector, persona)

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create worksheet with data
    const wsData = [
      ["Field", "Value"], // Header row
      ...dataToUse.fields.map((field) => [field.name, field.value]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "OCR Results")

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Save file with sector and persona info in the filename
    FileSaver.saveAs(data, `${sector}-${persona.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleSectorChange = (value: string) => {
    setSector(value as Sector)
    // Reset result when sector changes
    setResult(null)
  }

  const handlePersonaChange = (newPersona: Persona) => {
    setPersona(newPersona)
    // Reset result when persona changes
    setResult(null)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Persona dropdown on the left */}
        <div className="w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Persona: {persona}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePersonaChange("Joe")}>Joe</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePersonaChange("John")}>John</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePersonaChange("Günther")}>Günther</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title in the center */}
        <h1 className="text-3xl font-bold text-center w-1/3">A2D Documentation App</h1>

        {/* Empty space to balance the layout */}
        <div className="w-1/3"></div>
      </div>

      {/* Sector tabs aligned in the middle */}
      <div className="flex justify-center mb-8">
        <Tabs value={sector} onValueChange={handleSectorChange} className="w-full max-w-2xl">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="agriculture">Agriculture</TabsTrigger>
            <TabsTrigger value="powerplants">Power Plants</TabsTrigger>
            <TabsTrigger value="telecommunication">Telecommunication</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mode selection */}
      <div className="flex justify-center mb-8">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="w-full max-w-md">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
            <TabsTrigger value="download">Download Template</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {mode === "upload" ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Upload Photo</CardTitle>
              <CardDescription>
                Upload an image containing text to extract data using OCR
                {persona && sector && (
                  <span className="block mt-1 text-sm">
                    Analysis for: <strong>{persona}</strong> in <strong className="capitalize">{sector}</strong> sector
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or PDF (MAX. 10MB)</p>
                    </div>
                    {preview && (
                      <div className="relative w-full max-w-md mx-auto mt-4">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt="Preview"
                          className="max-h-40 mx-auto object-contain rounded-lg"
                        />
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleAnalyze} disabled={!file || isAnalyzing} className="w-full max-w-xs">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Analyze with OCR
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Download Template</CardTitle>
              <CardDescription>
                Download an Excel template with sample data
                {persona && sector && (
                  <span className="block mt-1 text-sm">
                    Template for: <strong>{persona}</strong> in <strong className="capitalize">{sector}</strong> sector
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <Button onClick={handleDownloadExcel} className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Excel Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result && mode === "upload" && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>OCR Results</CardTitle>
              <CardDescription>
                Extracted data from your image
                {persona && sector && (
                  <span className="block mt-1 text-sm">
                    For: <strong>{persona}</strong> in <strong className="capitalize">{sector}</strong> sector
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="structured">
                <TabsList className="mb-4">
                  <TabsTrigger value="structured">Structured Data</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>
                <TabsContent value="structured">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.fields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{field.name}</TableCell>
                          <TableCell>{field.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="raw">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{result.text}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDownloadExcel} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download as Excel
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

