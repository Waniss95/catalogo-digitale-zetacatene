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

            const parsed = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
            });

            this.prodotti = parsed.data.map((p, idx) => {
                const norm = this.normalizzaProdotto(p);

                if (!norm.codice) {
                    norm.codice = `NO-CODE-${idx + 1}`;
                    norm.senzaCodice = true;
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
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/^[\uFEFF\s]+|[\s]+$/g, "")
                .trim();

        const codiceReacto = (p["CODICE_REACTO"] || "").trim();

        // ░░░ LAVORAZIONI — unificate in un unico campo ░░░
        const lav1 = normalizza(p["Lav 1"]);
        const lav2 = normalizza(p["Lav 2"]);
        const lav3 = normalizza(p["Lav 3"]);

        const lavorazioniArray = [lav1, lav2, lav3].filter(v => v && v !== "");
        const lavorazioniUnificate = lavorazioniArray.join(" | ");

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
            lavorazioni: lavorazioniUnificate,   // 👈 aggiunto
            percorsoImmagine: codiceReacto
                ? `img/prodotti/${codiceReacto}.jpg`
                : "img/placeholder.jpg"
        };
    }

    estraiCategorie() {
        this.categorie.clear();
        this.prodotti.forEach(p => {
            const cat = p.normalizzato.categoria;
            if (cat) this.categorie.add(cat);
        });
    }

    getProdottiPerCategoria(nomeCategoria) {
        if (!nomeCategoria) return [];

        const nomePulito = nomeCategoria
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        return this.prodotti.filter(p => {
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
    }

    // --- GENERATORI DI FILTRI ---
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

    // ⭐️ NUOVO: FILTRO LAVORAZIONI
    getLavorazioniUniche() { 
        return this.getValoriUnici("lavorazioni"); 
    }
}

// Esporta classe globale
