import { Client } from "https://esm.sh/@gradio/client";

const GRADIO_SPACE = "xBeLQ/be-ear-cls";

const fileInput = document.getElementById("file-input");
const processBtn = document.getElementById("process-btn");
const previewImg = document.getElementById("preview");
const resultCard = document.getElementById("result-card");
const uploadArea = document.getElementById("upload-area");
const diagnosisEl = document.getElementById("diagnosis");
const probabilityEl = document.getElementById("probabilities");

let selectedFile = null;
let client = null;

async function initGradio() {
  try {
    client = await Client.connect(GRADIO_SPACE);
    console.log("✅ Gradio client ready");
  } catch (err) {
    console.error("❌ Gagal konek ke Gradio Space:", err);
    alert("Gagal terhubung ke Hugging Face Space. Coba refresh halaman.");
  }
}
initGradio();

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFile(file);
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar!");
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    resultCard.style.display = "none";
    processBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

processBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar terlebih dahulu!");
    return;
  }

  processBtn.textContent = "Memproses...";
  processBtn.disabled = true;

  try {
    const result = await client.predict("/predict", { image: selectedFile });
    console.log("API Response:", result);

    const data = result?.data ?? [];
    const diagnosis = data[0] ?? "-";
    const probabilities = data[1] ?? "-";

    diagnosisEl.textContent = diagnosis;
    probabilityEl.textContent = probabilities;
    resultCard.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Gagal memproses gambar. Coba lagi.");
  } finally {
    processBtn.textContent = "Proses Gambar";
    processBtn.disabled = false;
  }
});
