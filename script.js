const STATUSES = [
  { key: "novo", label: "novo" },
  { key: "validado", label: "validado" },
  { key: "whatsapp_enviado", label: "whatsapp_enviado" },
  { key: "respondeu", label: "respondeu" },
  { key: "nao_respondeu_48h", label: "nao respondeu 48h" },
  { key: "reuniao_marcada", label: "reunião marcada" },
  { key: "fechou", label: "fechou" },
  { key: "perdido", label: "perdido" }
];

const STORAGE_KEY = "lead_hunter_leads_v1";

const boardEl = document.getElementById("board");
const searchInput = document.getElementById("searchInput");
const addLeadBtn = document.getElementById("addLeadBtn");
const resetBtn = document.getElementById("resetBtn");

const leadDialog = document.getElementById("leadDialog");
const leadForm = document.getElementById("leadForm");
const cancelDialogBtn = document.getElementById("cancelDialogBtn");
const statusSelect = document.getElementById("statusSelect");

let leads = loadLeads();
let query = "";

init();

function init(){
  fillStatusSelect();
  render();
  wireEvents();
}

function wireEvents(){
  searchInput.addEventListener("input", (e) => {
    query = (e.target.value || "").toLowerCase().trim();
    render();
  });

  addLeadBtn.addEventListener("click", () => {
    leadForm.reset();
    statusSelect.value = "novo";
    openDialog();
  });

  cancelDialogBtn.addEventListener("click", () => {
    closeDialog();
  });

  leadForm.addEventListener("submit", () => {
    const data = new FormData(leadForm);
    const lead = {
      id: cryptoId(),
      name: clean(data.get("name")),
      company: clean(data.get("company")),
      instagram: clean(data.get("instagram")),
      phone: clean(data.get("phone")),
      notes: clean(data.get("notes")),
      status: String(data.get("status") || "novo"),
      createdAt: Date.now()
    };
    leads.unshift(lead);
    persist();
    render();
    closeDialog();
  });

  resetBtn.addEventListener("click", () => {
    leads = demoLeads();
    persist();
    render();
  });
}

function fillStatusSelect(){
  statusSelect.innerHTML = "";
  for(const s of STATUSES){
    const opt = document.createElement("option");
    opt.value = s.key;
    opt.textContent = s.label;
    statusSelect.appendChild(opt);
  }
}

function render(){
  boardEl.innerHTML = "";
  for(const status of STATUSES){
    const col = document.createElement("div");
    col.className = "column";

    const head = document.createElement("div");
    head.className = "colHead";

    const titleRow = document.createElement("div");
    titleRow.className = "colTitleRow";

    const title = document.createElement("h2");
    title.className = "colTitle";
    title.textContent = status.label;

    const count = document.createElement("span");
    count.className = "badge";

    const list = filteredLeads().filter(l => l.status === status.key);
    count.textContent = String(list.length);

    titleRow.appendChild(title);
    titleRow.appendChild(count);
    head.appendChild(titleRow);

    const dropzone = document.createElement("div");
    dropzone.className = "dropzone";
    dropzone.dataset.status = status.key;

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragOver");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragOver");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragOver");
      const leadId = e.dataTransfer.getData("text/leadId");
      if(!leadId) return;
      moveLeadToStatus(leadId, status.key);
    });

    for(const lead of list){
      dropzone.appendChild(renderCard(lead));
    }

    col.appendChild(head);
    col.appendChild(dropzone);
    boardEl.appendChild(col);
  }
}

function renderCard(lead){
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = lead.id;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/leadId", lead.id);
  });

  const top = document.createElement("div");
  top.className = "cardTop";

  const titleWrap = document.createElement("div");
  const h3 = document.createElement("h3");
  h3.textContent = lead.name || "Sem nome";
  titleWrap.appendChild(h3);

  const btn = document.createElement("button");
  btn.className = "smallBtn";
  btn.type = "button";
  btn.textContent = "Excluir";
  btn.addEventListener("click", () => {
    leads = leads.filter(l => l.id !== lead.id);
    persist();
    render();
  });

  top.appendChild(titleWrap);
  top.appendChild(btn);

  const meta = document.createElement("div");
  meta.className = "meta";

  if(lead.company){
    meta.appendChild(pill("empresa", lead.company));
  }
  if(lead.instagram){
    meta.appendChild(pill("ig", lead.instagram));
  }
  if(lead.phone){
    meta.appendChild(pill("tel", lead.phone));
  }

  const notes = document.createElement("div");
  notes.className = "note";
  notes.textContent = lead.notes ? lead.notes : "";

  card.appendChild(top);
  card.appendChild(meta);
  if(lead.notes) card.appendChild(notes);

  return card;
}

function pill(label, value){
  const el = document.createElement("div");
  el.className = "pill";
  el.textContent = `${label}: ${value}`;
  return el;
}

function moveLeadToStatus(leadId, statusKey){
  const idx = leads.findIndex(l => l.id === leadId);
  if(idx === -1) return;
  leads[idx].status = statusKey;
  persist();
  render();
}

function filteredLeads(){
  if(!query) return leads.slice();
  return leads.filter(l => {
    const blob = [
      l.name, l.company, l.instagram, l.phone, l.notes, l.status
    ].join(" ").toLowerCase();
    return blob.includes(query);
  });
}

function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function loadLeads(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return demoLeads();
    const data = JSON.parse(raw);
    if(!Array.isArray(data)) return demoLeads();
    return data;
  }catch{
    return demoLeads();
  }
}

function demoLeads(){
  return [
    {
      id: cryptoId(),
      name: "Dra. Ana",
      company: "Psicóloga",
      instagram: "@ana.psi",
      phone: "19 99999 0000",
      notes: "Perfil sem destaques e bio sem CTA",
      status: "novo",
      createdAt: Date.now()
    },
    {
      id: cryptoId(),
      name: "Cláudia",
      company: "Design de Interiores",
      instagram: "@claudia.interiores",
      phone: "11 98888 1111",
      notes: "Site ok, conteúdo sem sequência",
      status: "validado",
      createdAt: Date.now()
    },
    {
      id: cryptoId(),
      name: "Studio Verde",
      company: "Arquitetura",
      instagram: "@studioverde",
      phone: "19 97777 2222",
      notes: "Boa estética, falta oferta clara",
      status: "whatsapp_enviado",
      createdAt: Date.now()
    }
  ];
}

function openDialog(){
  if(typeof leadDialog.showModal === "function"){
    leadDialog.showModal();
  }
}

function closeDialog(){
  if(typeof leadDialog.close === "function"){
    leadDialog.close();
  }
}

function clean(v){
  return String(v || "").trim();
}

function cryptoId(){
  if(typeof crypto !== "undefined" && crypto.randomUUID){
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}
