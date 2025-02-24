import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

// Helper: Convert a data URI to a Blob.
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

const AdminPage = ({ username, onLogout }) => {
  const [excelData, setExcelData] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  // Up to three logos; the first one is the CDAC logo.
  const [logos, setLogos] = useState([null, null, null]);
  const [enabledLogos, setEnabledLogos] = useState([true, false, false]);
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  // For preview table selection and certificate preview.
  const [selectedRows, setSelectedRows] = useState([]);
  const [certificatePreview, setCertificatePreview] = useState(null);

  // ------------------ File Upload Handlers ------------------
  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setExcelData(sheetData);
      setSelectedRows([]); // reset any previous selections
      setCertificatePreview(null);
    };
    reader.readAsBinaryString(file);
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => setBackgroundImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (index, event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const updatedLogos = [...logos];
      updatedLogos[index] = e.target.result;
      setLogos(updatedLogos);
    };
    reader.readAsDataURL(file);
  };

  const toggleLogo = (index) => {
    const updatedEnabledLogos = [...enabledLogos];
    updatedEnabledLogos[index] = !updatedEnabledLogos[index];
    if (!updatedEnabledLogos[index]) {
      const updatedLogos = [...logos];
      updatedLogos[index] = null;
      setLogos(updatedLogos);
    }
    setEnabledLogos(updatedEnabledLogos);
  };

  // ------------------ Certificate Generation ------------------
  const generateCertificatePDF = (row) => {
    const doc = new jsPDF("landscape");

    if (backgroundImage) {
      doc.addImage(backgroundImage, "JPEG", 0, 0, 297, 210);
    }

    // First logo: Top left position.
    if (logos[0]) {
      doc.addImage(logos[0], "PNG", 49.5, 20, 37, 30);
    }

    // Second logo: Top center position.
    if (enabledLogos[1] && logos[1]) {
      const centerX = (297 - 40) / 2;
      doc.addImage(logos[1], "PNG", centerX, 20, 40, 30);
    }

    // Third logo: Top right position.
    if (enabledLogos[2] && logos[2]) {
      const rightX = 297 - 10 - 40;
      doc.addImage(logos[2], "PNG", 217.5, 20, 35, 28);
    }

    // Certificate text and details.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Certificate of Completion", 155.5, 80, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(
      `This is to certify that ${row.Name} has successfully completed the 
      ${row.Course} course from CDAC Bangalore`,
      155.5,
      90,
      { align: "center" }
    );
    doc.setFont("helvetica", "bold");
    doc.text(`${row.Course}`, 148.5, 110, { align: "center" });
    doc.text(`Duration: ${row.From} to ${row.To}`, 148.5, 130, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Dr. Mohammed Misbahuddin", 30, 160);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Scientist F & CI (C-HUK)", 33, 166);
    doc.text("C-DAC Bangalore", 36, 172);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Dr. S D Sudarshan", 239.5, 160, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Executive Director", 235.2, 166, { align: "center" });
    doc.text("C-DAC Bangalore", 236.5, 172, { align: "center" });
    return doc;
  };

  // ------------------ In–page Preview Handlers ------------------
  const handleRowSelectionChange = (index, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, index]);
    } else {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(excelData.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  };

  const previewSelectedCertificate = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to preview a certificate.");
      return;
    }
    if (!backgroundImage) {
      alert("Please upload a background image before previewing a certificate.");
      return;
    }
    // For preview, we generate the certificate for the first selected row.
    const row = excelData[selectedRows[0]];
    const doc = generateCertificatePDF(row);
    setCertificatePreview(doc.output("datauristring"));
  };

  // ------------------ Send Selected Unsigned Certificates ------------------
  const sendSelectedUnsignedCertificates = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to send.");
      return;
    }
    if (!backgroundImage) {
      alert("Please upload a background image before sending certificates.");
      return;
    }
    const unsignedCertificates = [];
    selectedRows.forEach((index) => {
      const row = excelData[index];
      const doc = generateCertificatePDF(row);
      const pdfBase64 = doc.output("datauristring");
      unsignedCertificates.push({
        name: row.Name,
        course: row.Course,
        pdf: pdfBase64,
      });
    });
    localStorage.setItem("unsignedCertificates", JSON.stringify(unsignedCertificates));
    alert("Selected unsigned certificates stored in localStorage!");
  };

  // ------------------ Receive Signed PDFs (unchanged) ------------------
  const receiveSignedPdfs = async () => {
    setIsReceiving(true);
    try {
      const finalPdfsStr = localStorage.getItem("adminFinalSignedPdfs");
      if (!finalPdfsStr) {
        alert("No final signed PDFs found in localStorage.");
        return;
      }
      const finalPdfsRecords = JSON.parse(finalPdfsStr).filter((record) => record);
      if (finalPdfsRecords.length === 0) {
        alert("No final signed PDFs found in localStorage.");
        return;
      }
      finalPdfsRecords.forEach((pdfRecord) => {
        const data = pdfRecord.pdf || pdfRecord.url;
        if (!data) {
          console.error("PDF record missing data:", pdfRecord);
          return;
        }
        if (data.startsWith("data:")) {
          const blob = dataURItoBlob(data);
          const url = URL.createObjectURL(blob);
          downloadPDF(url, pdfRecord.name);
          URL.revokeObjectURL(url);
        } else {
          downloadPDF(data, pdfRecord.name);
        }
      });
      alert("All final signed PDFs downloaded!");
    } catch (error) {
      console.error("Error receiving final signed PDFs:", error);
      alert("Failed to fetch final signed PDFs.");
    } finally {
      setIsReceiving(false);
    }
  };

  const downloadPDF = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-500 to-indigo-400 pt-32 pb-6">
      {/* Header */}
      <header className="relative w-full  mt-18 mb-8 flex flex-col items-center px-4 sm:px-8 md:px-32">
        <img
          src="src/assets/logo5.png"
          alt="Left Icon"
          className="absolute top-0 left-4 h-20 px-4 py-2"
        />
        <img
          src="src/assets/logo6.png"
          alt="Right Icon"
          className="absolute top-0 right-4 h-20 py-2"
        />
        <h1 className="text-4xl font-bold text-white">Centre for Development of Advanced Computing</h1>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
         
      </header>
      <div className="absolute top-4 right-28 flex mt- items-center space-x-4">
            <p className="text-xl text-white">Welcome, {username}!</p>
         <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md shadow-lg transition duration-300"
        >
        Logout
       </button>
       </div>
      {/* Main Content Area with Two Columns */}
      <main className="px-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Side – Upload & Actions */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-2xl px-4 sm:px-8 md:px-16 py-4">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Certificate Generator
            </h2>
            {/* Excel Upload Section */}
            <section className="space-y-2 p-4 bg-gray-50 rounded-lg shadow-md mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload Excel File
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Background & Logo Upload Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg shadow-md space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Background Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg shadow-md space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Logos
                </label>
                {logos.map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabledLogos[index]}
                        onChange={() => toggleLogo(index)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700 ml-2">
                        Logo {index + 1}
                      </span>
                    </div>
                    {enabledLogos[index] && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(index, e)}
                        className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Certificate Actions Section */}
            <section className="text-center p-4 bg-gray-50 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-800">Certificate Actions</h2>
              <div className="flex flex-col md:flex-row justify-center gap-4 mt-4">
                <button
                  onClick={receiveSignedPdfs}
                  disabled={isReceiving}
                  className={`inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-md transition-colors ${
                    isReceiving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isReceiving ? "Receiving..." : "Receive Signed PDFs"}
                </button>
                <button
                  onClick={sendSelectedUnsignedCertificates}
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md transition-colors"
                >
                  Send Selected Unsigned Certificates
                </button>
              </div>
            </section>
          </div>

          {/* Right Side – Preview Data & Certificate */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-2xl px-4 sm:px-8 md:px-16 py-4">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Preview Data & Certificate
            </h2>
            {excelData.length > 0 ? (
              <>
                {/* Preview Data Table */}
                <div className="overflow-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">
                          <input
                            type="checkbox"
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            checked={selectedRows.length === excelData.length}
                          />
                        </th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Course</th>
                        <th className="px-4 py-2">From</th>
                        <th className="px-4 py-2">To</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {excelData.map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(index)}
                              onChange={(e) =>
                                handleRowSelectionChange(index, e.target.checked)
                              }
                            />
                          </td>
                          <td className="px-4 py-2">{row.Name || ""}</td>
                          <td className="px-4 py-2">{row.Course || ""}</td>
                          <td className="px-4 py-2">{row.From || ""}</td>
                          <td className="px-4 py-2">{row.To || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={previewSelectedCertificate}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Preview Certificate
                  </button>
                </div>
                {certificatePreview && (
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Certificate Preview
                    </h3>
                    <iframe
                      src={certificatePreview}
                      width="100%"
                      height="400px"
                      title="Certificate Preview"
                    ></iframe>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center">No data uploaded yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
