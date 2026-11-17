(() => {
  "use strict";

  const MAX_IMAGES = 30;
  const state = { images: [], orientation: "portrait", fit: "contain" };
  const $ = (selector) => document.querySelector(selector);
  const fileInput = $("#file-input");
  const dropZone = $("#drop-zone");
  const previewList = $("#preview-list");
  const imageCount = $("#image-count");
  const addMore = $("#add-more-button");
  const generate = $("#generate-button");
  const status = $("#status-message");
  const estimate = $("#output-estimate");
  const toast = $("#toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function acceptFiles(fileList) {
    const files = [...fileList].filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (files.length === 0) {
      setStatus("Please choose JPG, PNG, or WebP images.", true);
      return;
    }
    if (state.images.length + files.length > MAX_IMAGES) {
      setStatus(`You can add up to ${MAX_IMAGES} images per PDF.`, true);
    }
    files.slice(0, MAX_IMAGES - state.images.length).forEach((file) => {
      state.images.push({ file, url: URL.createObjectURL(file) });
    });
    render();
    fileInput.value = "";
  }

  function removeImage(index) {
    URL.revokeObjectURL(state.images[index].url);
    state.images.splice(index, 1);
    render();
  }

  function moveImage(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= state.images.length) return;
    [state.images[index], state.images[target]] = [state.images[target], state.images[index]];
    render();
  }

  function render() {
    imageCount.textContent = `${state.images.length} selected`;
    addMore.disabled = state.images.length >= MAX_IMAGES;
    generate.disabled = state.images.length === 0;
    estimate.textContent = state.images.length ? `${state.images.length} page${state.images.length === 1 ? "" : "s"} · ready to export` : "Add images to begin";
    previewList.innerHTML = state.images.map((item, index) => `
      <figure class="preview-card" draggable="true" data-index="${index}" title="Use the arrows to reorder">
        <img src="${item.url}" alt="${escapeHtml(item.file.name)} preview" />
        <span class="preview-index">${index + 1}</span>
        <button class="remove-image" type="button" data-remove="${index}" aria-label="Remove ${escapeHtml(item.file.name)}">×</button>
        <figcaption>${escapeHtml(item.file.name)}</figcaption>
        <div class="card-actions">
          <button type="button" data-move="${index}" data-direction="-1" aria-label="Move image earlier">←</button>
          <button type="button" data-move="${index}" data-direction="1" aria-label="Move image later">→</button>
        </div>
      </figure>
    `).join("");
    previewList.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => removeImage(Number(button.dataset.remove))));
    previewList.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveImage(Number(button.dataset.move), Number(button.dataset.direction))));
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not read ${file.name}`));
      image.src = URL.createObjectURL(file);
    });
  }

  async function generatePdf() {
    if (!state.images.length) return;
    if (!window.jspdf?.jsPDF) {
      setStatus("The PDF engine did not load. Check your connection and try again.", true);
      return;
    }
    generate.disabled = true;
    generate.innerHTML = "<span class=\"spinner\" aria-hidden=\"true\"></span> Creating your PDF…";
    setStatus("Preparing images locally…");
    try {
      const pageSize = $("#page-size").value;
      const margin = Number($("#margin").value);
      const firstImage = await loadImage(state.images[0].file);
      let pdf;
      if (pageSize === "image") {
        const orientation = firstImage.width >= firstImage.height ? "landscape" : "portrait";
        pdf = new window.jspdf.jsPDF({ orientation, unit: "px", format: [firstImage.width, firstImage.height], compress: true });
      } else {
        pdf = new window.jspdf.jsPDF({ orientation: state.orientation, unit: "mm", format: pageSize, compress: true });
      }
      for (let i = 0; i < state.images.length; i += 1) {
        setStatus(`Creating page ${i + 1} of ${state.images.length}…`);
        const image = i === 0 ? firstImage : await loadImage(state.images[i].file);
        if (i > 0) {
          const imageOrientation = image.width >= image.height ? "landscape" : "portrait";
          pdf.addPage(pageSize === "image" ? [image.width, image.height] : undefined, pageSize === "image" ? imageOrientation : state.orientation);
        }
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const edge = pageSize === "image" ? 0 : margin;
        const availableWidth = Math.max(1, pageWidth - edge * 2);
        const availableHeight = Math.max(1, pageHeight - edge * 2);
        const imageRatio = image.width / image.height;
        const boxRatio = availableWidth / availableHeight;
        let width;
        let height;
        if (state.fit === "original") {
          width = Math.min(image.width, availableWidth);
          height = width / imageRatio;
          if (height > availableHeight) { height = availableHeight; width = height * imageRatio; }
        } else if (state.fit === "cover") {
          if (imageRatio > boxRatio) { height = availableHeight; width = height * imageRatio; } else { width = availableWidth; height = width / imageRatio; }
        } else {
          if (imageRatio > boxRatio) { width = availableWidth; height = width / imageRatio; } else { height = availableHeight; width = height * imageRatio; }
        }
        const x = edge + (availableWidth - width) / 2;
        const y = edge + (availableHeight - height) / 2;
        const format = state.images[i].file.type === "image/png" ? "PNG" : "JPEG";
        pdf.addImage(image, format, x, y, width, height, undefined, "MEDIUM");
        URL.revokeObjectURL(image.src);
      }
      pdf.save(`photo-pdf-${new Date().toISOString().slice(0, 10)}.pdf`);
      setStatus("PDF downloaded successfully.");
      showToast("Your PDF is ready to share.");
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong while creating the PDF. Please try again.", true);
    } finally {
      generate.disabled = state.images.length === 0;
      generate.innerHTML = "<span aria-hidden=\"true\">✦</span> Generate PDF <span aria-hidden=\"true\">→</span>";
    }
  }

  $("#browse-button").addEventListener("click", () => fileInput.click());
  addMore.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (event) => acceptFiles(event.target.files));
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("dragging"); }));
  dropZone.addEventListener("drop", (event) => acceptFiles(event.dataTransfer.files));
  dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); } });
  document.querySelectorAll("[data-orientation]").forEach((button) => button.addEventListener("click", () => {
    state.orientation = button.dataset.orientation;
    document.querySelectorAll("[data-orientation]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  document.querySelectorAll("[data-fit]").forEach((button) => button.addEventListener("click", () => {
    state.fit = button.dataset.fit;
    document.querySelectorAll("[data-fit]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  $("#margin").addEventListener("input", (event) => { $("#margin-value").textContent = `${event.target.value} mm`; });
  generate.addEventListener("click", generatePdf);
  render();
})();
