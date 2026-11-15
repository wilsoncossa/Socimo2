/* =========================================================
   SOCIMO - Lógica de interactividade
   Inclui renderização, pesquisa linear, ordenação, CRUD simples
   e persistência local através de localStorage.
   ========================================================= */

// Dados institucionais resumidos a partir do website oficial.
const initialAreas = [
  {id:1, name:"Imobiliário", description:"Segmentos residencial, escritórios corporativos, retalho e logística industrial.", category:"Investimento"},
  {id:2, name:"Logística", description:"Transporte, armazenagem e coordenação da cadeia de abastecimento.", category:"Operações"},
  {id:3, name:"Tecnologia", description:"Soluções digitais para eficiência, conectividade e desempenho operacional.", category:"Tecnologia"},
  {id:4, name:"Procurement", description:"Aprovisionamento e sourcing para projectos e fornecedores.", category:"Operações"},
  {id:5, name:"Energia e indústria", description:"Investimentos nos sectores energético, mineiro e industrial.", category:"Indústria"},
  {id:6, name:"Holdings financeiras", description:"Carteira diversificada de investimentos estratégicos.", category:"Investimento"},
  {id:7, name:"Comércio geral", description:"Comércio por grosso e a retalho, importação e exportação.", category:"Comércio"}
];

const STORAGE_KEY = "socimo-redesign-areas-v1";
const businessGrid = document.getElementById("businessGrid");
const catalogueGrid = document.getElementById("catalogueGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
let areas = loadAreas();

// Recupera os dados guardados; se não existirem, usa os dados iniciais.
function loadAreas() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...initialAreas];
  } catch (error) {
    console.warn("Não foi possível ler os dados locais:", error);
    return [...initialAreas];
  }
}

// Persiste a lista no navegador, sem enviar dados para um servidor.
function saveAreas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
  } catch (error) {
    alert("Não foi possível guardar os dados neste navegador.");
    console.error(error);
  }
}

// Evita inserir texto fornecido pelo utilizador como HTML executável.
function createTextElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

// Desenha os sete cartões institucionais apresentados na secção principal.
function renderBusinessCards() {
  businessGrid.replaceChildren();
  initialAreas.forEach(area => {
    const card = document.createElement("article");
    card.className = "business-card";
    card.append(createTextElement("span", String(area.id).padStart(2, "0"), "number"));
    const content = document.createElement("div");
    content.append(createTextElement("h3", area.name));
    content.append(createTextElement("p", area.description));
    card.append(content);
    businessGrid.append(card);
  });
}

// Preenche o filtro com as categorias existentes sem duplicações.
function populateCategories() {
  const categories = [...new Set(areas.map(area => area.category || "Outros"))].sort();
  const current = categoryFilter.value;
  categoryFilter.replaceChildren(new Option("Todas as áreas", "todas"));
  categories.forEach(category => categoryFilter.add(new Option(category, category)));
  if (categories.includes(current)) categoryFilter.value = current;
}

// Pesquisa linear: percorre a lista e compara nome e descrição.
function searchAreas(list, term) {
  const normalizedTerm = term.trim().toLocaleLowerCase("pt");
  if (!normalizedTerm) return [...list];
  return list.filter(area =>
    area.name.toLocaleLowerCase("pt").includes(normalizedTerm) ||
    area.description.toLocaleLowerCase("pt").includes(normalizedTerm)
  );
}

// Ordena uma cópia da lista, preservando a ordem original dos dados.
function sortAreas(list, criterion) {
  const sorted = [...list];
  if (criterion === "az") sorted.sort((a,b) => a.name.localeCompare(b.name, "pt"));
  if (criterion === "za") sorted.sort((a,b) => b.name.localeCompare(a.name, "pt"));
  if (criterion === "numero") sorted.sort((a,b) => a.id - b.id);
  return sorted;
}

// Actualiza os cartões de acordo com pesquisa, categoria e ordenação.
function renderCatalogue() {
  const term = searchInput.value;
  const category = categoryFilter.value;
  let filtered = searchAreas(areas, term);
  if (category !== "todas") filtered = filtered.filter(area => (area.category || "Outros") === category);
  filtered = sortAreas(filtered, sortSelect.value);

  catalogueGrid.replaceChildren();
  resultCount.textContent = `${filtered.length} elemento(s) encontrado(s)`;

  if (filtered.length === 0) {
    const empty = createTextElement("p", "Não foram encontrados elementos. Experimente outro termo.", "empty-state");
    catalogueGrid.append(empty);
    return;
  }

  filtered.forEach(area => {
    const card = document.createElement("article");
    card.className = "catalogue-card";
    card.append(createTextElement("span", area.category || "Outros", "tag"));
    card.append(createTextElement("h3", area.name));
    card.append(createTextElement("p", area.description));
    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(createTextElement("span", `ID ${area.id}`, "tag"));

    // O botão de remoção é apresentado apenas para elementos criados na demonstração.
    if (!initialAreas.some(item => item.id === area.id)) {
      const removeButton = createTextElement("button", "Remover", "remove-button");
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `Remover ${area.name}`);
      removeButton.addEventListener("click", () => removeArea(area.id));
      actions.append(removeButton);
    }
    card.append(actions);
    catalogueGrid.append(card);
  });
}

// Adiciona um elemento de demonstração e guarda a lista actualizada.
function addArea(name, description) {
  const newId = Math.max(0, ...areas.map(area => area.id)) + 1;
  areas.push({id:newId, name, description, category:"Demonstração"});
  saveAreas();
  populateCategories();
  renderCatalogue();
}

// Remove um elemento pelo seu identificador.
function removeArea(id) {
  const target = areas.find(area => area.id === id);
  if (!target) return;
  if (!confirm(`Pretende remover "${target.name}"?`)) return;
  areas = areas.filter(area => area.id !== id);
  saveAreas();
  populateCategories();
  renderCatalogue();
}

// Eventos dos controlos: cada alteração actualiza a lista visível.
searchInput.addEventListener("input", renderCatalogue);
categoryFilter.addEventListener("change", renderCatalogue);
sortSelect.addEventListener("change", renderCatalogue);

document.getElementById("addForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("newName").value.trim();
  const description = document.getElementById("newDescription").value.trim();
  if (!name || !description) return;
  addArea(name, description);
  event.target.reset();
  document.getElementById("searchInput").value = "";
  categoryFilter.value = "todas";
});

document.getElementById("resetButton").addEventListener("click", () => {
  areas = [...initialAreas];
  saveAreas();
  searchInput.value = "";
  categoryFilter.value = "todas";
  sortSelect.value = "az";
  populateCategories();
  renderCatalogue();
});

// Menu acessível em ecrãs pequenos.
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

// Inicialização da interface.
document.getElementById("year").textContent = new Date().getFullYear();
renderBusinessCards();
populateCategories();
renderCatalogue();
