"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Download, Loader2, User, FileDown, Replace } from "lucide-react"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Grid } from "@/components/ui/grid"
import { Image } from "@/components/ui/image"

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
type Sector = "Biogas plants" | "Feed mixer" | "Solar energy systems"
type Mode = "upload" | "download"

// Get mock data based on sector and persona
const getMockDataForSector = (sector: Sector, persona: Persona): OcrResult => {
  let fields: OcrField[] = []
  const text =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

  // Sector-specific fields
  if (sector === "Biogas plants") {
    fields = [
      { name: "Crop Type", value: "Wheat" },
      { name: "Field Size", value: "120 acres" },
      { name: "Planting Date", value: "2023-03-15" },
      { name: "Expected Yield", value: "5.2 tons/acre" },
      { name: "Soil pH", value: "6.8" },
      { name: "Irrigation", value: "Drip system" },
    ]
  } else if (sector === "Feed mixer") {
    fields = [
      { name: "Plant ID", value: "PP-2023-0042" },
      { name: "Capacity", value: "250 MW" },
      { name: "Fuel Type", value: "Natural Gas" },
      { name: "Efficiency", value: "87%" },
      { name: "CO2 Emissions", value: "450 g/kWh" },
      { name: "Operational Since", value: "2015-06-22" },
    ]
  } else {
    // Solar energy systems
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

// Add a new function to fetch images from the cloud
const fetchImagesFromCloud = async (sector: Sector): Promise<string[]> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))
  
  // Return mock image URLs based on sector
  // In a real implementation, these would come from your cloud storage
  if (sector === "Biogas plants") {
    return [
      "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=1&most_recent",
      "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=2&most_recent",
      "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=3&most_recent",
      "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/image/?id=4&most_recent"
    ]
  } else if (sector === "Feed mixer") {
    return [
      "/Pictures/sample_feed_mixer_1.jpg",
      "/Pictures/sample_feed_mixer_2.jpg",
      "/Pictures/sample_feed_mixer_3.jpg",
      "/Pictures/sample_feed_mixer_4.jpg"
    ]
  } else {
    // Solar energy systems
    return [
      "/Pictures/sample_solar_1.jpg",
      "/Pictures/sample_solar_2.jpg",
      "/Pictures/sample_solar_3.jpg",
      "/Pictures/sample_solar_4.jpg"
    ]
  }
}

export default function OcrPhotoAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [persona, setPersona] = useState<Persona>("Joe")
  const [sector, setSector] = useState<Sector>("Biogas plants")
  const [mode, setMode] = useState<Mode>("upload")

  // Add state for cloud images
  const [cloudImages, setCloudImages] = useState<string[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)

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

  const handleDownloadExcel = async () => {
    /*try {
      // URL of the Excel file to download
      const url = "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/data/?most_recent";
      
      // Fetch the Excel file
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
      }
      
      // Get the file as array buffer
      const excelBuffer = await response.arrayBuffer();
      
      // Create a Blob from the array buffer
      const data = new Blob([excelBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      
      // Generate a filename with sector and persona info
      const filename = `${sector}-${persona.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Save the file directly
      FileSaver.saveAs(data, filename);
      
      console.log(`Excel file downloaded and saved as ${filename}`);
      
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      // You may want to add error handling here, such as showing an error message to the user

    }*/ 
      if (sector === "Biogas plants") {
        window.location.href = "https://tms.deebugger.de/bd34634c-0876-4f8f-b506-2e6cf19d34be/api/frontend/data/?most_recent"; // Change the URL here

      } else if (sector === "Feed mixer") {
        
      } else {
        
      }
    
  };

  const handleSectorChange = (value: string) => {
    setSector(value as Sector)
    // Reset both result and cloud images when sector changes
    setResult(null)
    setCloudImages([]) // Clear the cloud images
  }

  const handlePersonaChange = (newPersona: Persona) => {
    setPersona(newPersona)
    // Reset result when persona changes
    setResult(null)
  }

  // Add a new handler for fetching templates and images
  const handleGetTemplateAndPictures = async () => {
    setIsLoadingImages(true)
    try {
      // Fetch images from cloud
      const images = await fetchImagesFromCloud(sector)
      setCloudImages(images)
      
      // Download Excel template automatically
      handleDownloadExcel()
    } catch (error) {
      console.error("Failed to fetch images:", error)
    } finally {
      setIsLoadingImages(false)
    }
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
            <TabsTrigger value="Biogas plants">Biogas plants</TabsTrigger>
            <TabsTrigger value="Feed mixer">Feed mixer</TabsTrigger>
            <TabsTrigger value="Solar energy systems">Solar energy systems</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mode selection */}
      <div className="flex justify-center mb-8">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="w-full max-w-md">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload">Download template and pictures</TabsTrigger>
            <TabsTrigger value="download">Download template</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {mode === "upload" ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Get Template and Pictures</CardTitle>
              <CardDescription>
                Download an Excel template and reference pictures for your documentation
                {persona && sector && (
                  <span className="block mt-1 text-sm">
                    For: <strong>{persona}</strong> in <strong className="capitalize">{sector}</strong> sector
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex justify-center">
                  <Button 
                    onClick={handleGetTemplateAndPictures} 
                    disabled={isLoadingImages} 
                    className="w-full max-w-xs"
                  >
                    {isLoadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Get Template and Pictures
                      </>
                    )}
                  </Button>
                </div>

                {/* Display cloud images */}
                {cloudImages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Reference Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {cloudImages.map((imageUrl, index) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`Reference image ${index + 1}`} 
                            className="w-full h-auto object-contain"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

