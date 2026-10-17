import { Client, handle_file } from "https://esm.sh/@gradio/client";

const GRADIO_SPACE = "xBeLQ/be-ear-cls";

const fileInput = document.getElementById("file-input");
const processBtn = document.getElementById("process-btn");
const previewImg = document.getElementById("preview");
const resultCard = document.getElementById("result-card");
const uploadArea = document.getElementById("upload-area");
const diagnosisEl = document.getElementById("diagnosis");
const probabilityEl = document.getElementById("probabilities");

let selectedFile = null;
let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(GRADIO_SPACE)
      .then((client) => {
        console.log("✅ Gradio client ready");
        return client;
      })
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise;
}
getClient().catch((err) => console.error("❌ Gagal konek ke Gradio Space:", err));

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

function renderProbabilities(text) {
  const rows = String(text)
    .split("\n")
    .map((line) => line.match(/^\s*-?\s*(.+?):\s*([\d.]+)\s*%/))
    .filter(Boolean)
    .map(([, name, value]) => ({ name, value: parseFloat(value) }));

  probabilityEl.innerHTML = "";
  if (!rows.length) {
    probabilityEl.textContent = text;
    return;
  }

  const max = Math.max(...rows.map((r) => r.value));
  for (const { name, value } of rows) {
    const row = document.createElement("div");
    row.className = "prob-row" + (value === max ? " top" : "");

    const header = document.createElement("div");
    header.className = "prob-header";
    const nameEl = document.createElement("span");
    nameEl.textContent = name;
    const valueEl = document.createElement("span");
    valueEl.className = "prob-value";
    valueEl.textContent = `${value.toFixed(2)}%`;
    header.append(nameEl, valueEl);

    const track = document.createElement("div");
    track.className = "prob-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", name);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", value.toFixed(2));
    const fill = document.createElement("div");
    fill.className = "prob-fill";
    track.append(fill);

    row.append(header, track);
    probabilityEl.append(row);
    requestAnimationFrame(() => {
      fill.style.width = `${Math.min(value, 100)}%`;
    });
  }
}

function describeError(err) {
  const title = err?.title ?? "";
  const message = err?.message ?? "";
  if (/quota/i.test(title) || /quota|runs limit/i.test(message)) {
    return "Kuota GPU gratis Hugging Face (ZeroGPU) sudah habis untuk koneksi ini. Coba lagi nanti setelah kuota direset.";
  }
  if (message) {
    return `Gagal memproses gambar: ${message}`;
  }
  return "Gagal memproses gambar. Coba lagi.";
}

processBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar terlebih dahulu!");
    return;
  }

  processBtn.textContent = "Memproses...";
  processBtn.disabled = true;

  try {
    const client = await getClient();
    const result = await client.predict("/predict_image", {
      image: handle_file(selectedFile),
    });
    console.log("API Response:", result);

    const data = result?.data ?? [];
    const diagnosis = data[0] ?? "-";
    const probabilities = data[1] ?? "-";

    diagnosisEl.textContent = diagnosis;
    renderProbabilities(probabilities);
    resultCard.style.display = "block";
  } catch (err) {
    console.error(err);
    alert(describeError(err));
  } finally {
    processBtn.textContent = "Proses Gambar";
    processBtn.disabled = false;
  }
});
