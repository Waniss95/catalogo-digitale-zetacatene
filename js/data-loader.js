// ✅ DATA LOADER — supporta prodotti SENZA codice prodotto
class CSVDataLoader {
    constructor() {
        this.prodotti = [];
        this.categorie = new Set();
    }

    async caricaCSV() {
        try {
            console.log("📂 Caricamento CSV da ./data/catalogo_zetacatene_web.csv");
            const response = await fetch("./data/catalogo_zetacatene_web.csv");
            if (!response.ok) throw new Error(`Errore caricamento CSV (${response.status})`);
            const text = await response.text();

            // ✅ parsing CSV solido (gestisce virgole nelle descrizioni ecc.)
            const parsed = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
            });

            // parsed.data è un array di oggetti con le chiavi del CSV
            this.prodotti = parsed.data.map((p, idx) => {
                // Normalizzato con i campi già puliti
                const norm = this.normalizzaProdotto(p);

                // Se codice è vuoto, generiamo un id fallback così abbiamo qualcosa di unico da usare nel DOM
                if (!norm.codice) {
                    norm.codice = `NO-CODE-${idx + 1}`;
                    norm.senzaCodice = true; // flag utile se vuoi visualizzare diversamente
                }

                return {
                    ...p,
                    normalizzato: norm
                };
            });

            this.estraiCategorie();

            console.log("📋 Categorie trovate:", [...this.categorie]);
            console.log(`✅ Prodotti caricati dal CSV: ${this.prodotti.length}`);

            return this.prodotti;
        } catch (err) {
            console.error("❌ Errore caricamento CSV:", err);
            return [];
        }
    }

    // --- NORMALIZZAZIONE DATI ---
    normalizzaProdotto(p) {
        const normalizza = v =>
            (v || "")
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // togli accenti
                .replace(/^[\uFEFF\s]+|[\s]+$/g, "") // togli BOM/spazi strani
                .trim();
    const codiceReacto = (p["CODICE_REACTO"] || "").trim();

        // NB: categoria abbassata a minuscolo per confronto
        return {
            categoria: normalizza(p["Categoria"]).toLowerCase(),
            aspetto: normalizza(p["ASPETTO"]),
            filo: normalizza(p["Filo"]),
            materiale: normalizza(p["Materiale"]),
            internoFilo: normalizza(p["Interno Filo"]),
            spessore: normalizza(p["Dim Filo"]),
            peso: normalizza(p["Peso (g)"]),
            descrizione: normalizza(p["Descrizione"]),
            codice: normalizza(p["Codice prodotto"]),
            percorsoImmagine: codiceReacto
        ? `img/prodotti/${codiceReacto}.jpg`
        : "img/placeholder.jpg"
};
    }

    // --- ESTRAE CATEGORIE UNICHE ---
    estraiCategorie() {
        this.categorie.clear();
        this.prodotti.forEach(p => {
            const cat = p.normalizzato.categoria;
            if (cat) this.categorie.add(cat);
        });
        console.log("📁 Categorie trovate:", [...this.categorie]);
    }

    // --- OTTIENE PRODOTTI PER CATEGORIA (case-insensitive, toglie accenti/spazi sporchi)
    getProdottiPerCategoria(nomeCategoria) {
        if (!nomeCategoria) return [];

        const nomePulito = nomeCategoria
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        const risultati = this.prodotti.filter(p => {
            const cat = (p.normalizzato.categoria || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase();

            return (
                cat === nomePulito ||
                cat.includes(nomePulito) ||
                nomePulito.includes(cat)
            );
        });

        console.log(`🔎 Categoria cercata: "${nomeCategoria}" → normalizzata: "${nomePulito}"`);
        console.log(`✅ Trovati ${risultati.length} prodotti per questa categoria`);
        return risultati;
    }

    // --- FUNZIONI PER I FILTRI DINAMICI ---
    getValoriUnici(campo) {
        const valori = new Set();
        this.prodotti.forEach(p => {
            const valore = p.normalizzato[campo];
            if (valore) valori.add(valore);
        });
        return Array.from(valori).sort();
    }

    getAspettiUnici()     { return this.getValoriUnici("aspetto"); }
    getFiliUnici()        { return this.getValoriUnici("filo"); }
    getMaterialiUnici()   { return this.getValoriUnici("materiale"); }
    getInterniFiloUnici() { return this.getValoriUnici("internoFilo"); }
    getSpessoriUnici()    { return this.getValoriUnici("spessore"); }
    getPesiUnici()        { return this.getValoriUnici("peso"); }
}

// ✅ Classe globale usata in gruppo.html
