import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { POKEMON_FORM_COUNTS } from "@/lib/pokemon-data";
import { ArrowUp, ArrowDown } from "lucide-react";

// We need a list of all pokemon. Since pokemon-data doesn't export a flat list, 
// we'll assume a range or fetch from PokeAPI? 
// Actually, looking at pokemon-data.ts, it doesn't seem to export a full list of names/ids directly 
// other than the form counts and some helpers.
// However, earlier I saw `export interface Pokemon` but no huge constant array.
// Wait, looking at `pokemon-data.ts` content again (from history), it exports `POKEMON_FORM_COUNTS`, `HUNTING_METHODS`, `POKEBALLS`, `GAMES`.
// It DOES NOT seem to export a full list of ALL pokemon names.
// This is a problem for the Mapper if we want a dropdown.
// I will fetch the list of Pokemon from PokeAPI for the dropdown, or just use a text input for ID/Name if strictly necessary.
// Better: Use a reliable list. I'll include a small fetch to PokeAPI to populate the dropdown 
// OR just ask the user to enter the National Dex ID.
// Entering ID is safer and faster for them probably if they know it, but search is better.
// Let's implement a simple fetch from PokeAPI to get the names for the dropdown.

interface SpriteFile {
  name: string;
}

interface Mapping {
  [pokemonId: string]: string; // pokemonId -> filename
}

export default function SpriteMapper() {
  const [sprites, setSprites] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mapping, setMapping] = useState<Mapping>({});
  const [pokemonList, setPokemonList] = useState<{ name: string, url: string, id: string, displayName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPokemonId, setSelectedPokemonId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Load sprite list
    fetch("/sprites/index.json")
      .then(res => res.json())
      .then((files: string[]) => {
        // filter for gifs
        const gifFiles = files.filter(f => f.endsWith('.gif'));
        // Sort numerically if possible to help user predict order
        gifFiles.sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''));
          const numB = parseInt(b.replace(/\D/g, ''));
          return numA - numB;
        });
        setSprites(gifFiles);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sprites", err);
        toast({ title: "Error", description: "Could not load sprite list. Did you run the command?", variant: "destructive" });
      });

    // Load Pokemon names from PokeAPI for search
    // Load Pokemon names from PokeAPI for search - limit 10000 to get all forms/variants
    fetch("https://pokeapi.co/api/v2/pokemon?limit=10000")
      .then(res => res.json())
      .then(data => {
        let fullList = data.results.map((p: any) => {
          // Extract ID from URL for forms which have high IDs
          const parts = p.url.split('/');
          const id = parts[parts.length - 2];
          return { ...p, id, displayName: p.name };
        });

        // Custom season handling for Deerling (585) and Sawsbuck (586)
        // User wants to replace #585 with #585-spring and #586 with #586-spring
        const seasonalMons = [
          { id: "585", name: "deerling" },
          { id: "586", name: "sawsbuck" }
        ];

        // Filter out the generic base forms
        fullList = fullList.filter((p: any) => p.id !== "585" && p.id !== "586");

        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        const extraForms: { name: string, id: string, displayName: string, url: string }[] = [];

        seasonalMons.forEach(base => {
          seasons.forEach(season => {
            const formName = `${base.name}-${season}`;
            // Remove existing PokeAPI version if present to avoid duplicates and ensure our format
            fullList = fullList.filter((p: any) => p.name !== formName);

            extraForms.push({
              name: formName,
              id: `${base.id}-${season}`,
              displayName: `${base.name} (${season})`,
              url: ""
            });
          });
        });

        // Flower variants for Flabébé (#669), Floette (#670), Florges (#671)
        const flowerMons = [
          { id: "669", name: "flabébé" },
          { id: "670", name: "floette" },
          { id: "671", name: "florges" }
        ];
        const colors = ['red', 'white', 'blue', 'yellow', 'orange'];

        flowerMons.forEach(base => {
          // Filter out the generic base form and potential PokeAPI duplicates
          fullList = fullList.filter((p: any) => p.id !== base.id && !p.name.startsWith(`${base.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}-`));

          colors.forEach(color => {
            const displayName = color === 'red' ? `${base.name} (red flower)` : `${base.name} (${color})`;
            const name = `${base.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}-${color}`;

            extraForms.push({
              name: name,
              id: `${base.id}-${color}`,
              displayName: displayName,
              url: ""
            });
          });
        });

        // Burmy variants (#412)
        const burmyForms = ['plant', 'sandy', 'trash'];
        fullList = fullList.filter((p: any) => p.id !== "412" && !p.name.startsWith("burmy-"));
        burmyForms.forEach(form => {
          extraForms.push({
            name: `burmy-${form}`,
            id: `412-${form}`,
            displayName: `burmy (${form})`,
            url: ""
          });
        });

        // Shellos/Gastrodon East forms
        const seaMons = [
          { id: "422", name: "shellos" },
          { id: "423", name: "gastrodon" }
        ];
        seaMons.forEach(base => {
          // Add east version
          extraForms.push({
            name: `${base.name}-east`,
            id: `${base.id}-east`,
            displayName: `${base.name} (east)`,
            url: ""
          });
        });

        // Vivillon patterns (#666)
        const vivillonPatterns = [
          'archipelago', 'continental', 'elegant', 'garden', 'high-plains',
          'icy-snow', 'jungle', 'marine', 'meadow', 'modern',
          'monsoon', 'ocean', 'polar', 'river', 'sandstorm',
          'savanna', 'sun', 'tundra', 'poke-ball', 'fancy'
        ];
        fullList = fullList.filter((p: any) => p.id !== "666" && !p.name.startsWith("vivillon-"));
        vivillonPatterns.forEach(pattern => {
          extraForms.push({
            name: `vivillon-${pattern}`,
            id: `666-${pattern}`,
            displayName: `vivillon (${pattern})`,
            url: ""
          });
        });

        // Alcremie forms (#869) - 63 combinations (9 creams x 7 sweets)
        const alcremieCreams = [
          'vanilla-cream', 'ruby-cream', 'matcha-cream', 'mint-cream',
          'lemon-cream', 'salted-cream', 'ruby-swirl', 'caramel-swirl', 'rainbow-swirl'
        ];
        const alcremieSweets = [
          'strawberry-sweet', 'berry-sweet', 'love-sweet', 'star-sweet',
          'clover-sweet', 'flower-sweet', 'ribbon-sweet'
        ];
        fullList = fullList.filter((p: any) => p.id !== "869" && !p.name.startsWith("alcremie-"));
        alcremieCreams.forEach(cream => {
          alcremieSweets.forEach(sweet => {
            const formName = `${cream}-${sweet}`;
            extraForms.push({
              name: `alcremie-${formName}`,
              id: `869-${formName}`,
              displayName: `alcremie (${cream.replace('-', ' ')} - ${sweet.replace('-', ' ')})`,
              url: ""
            });
          });
        });

        // Also add generic forms from POKEMON_FORM_COUNTS if not covered by PokeAPI list
        // (PokeAPI list > 10000 usually covers them, but we keep this as fallback or helper)
        Object.entries(POKEMON_FORM_COUNTS).forEach(([idStr, count]) => {
          const id = parseInt(idStr);
          // Unown handling
          if (id === 201) {
            const baseMon = fullList.find((p: any) => p.id === idStr);
            if (baseMon) {
              const unownChars = "abcdefghijklmnopqrstuvwxyz?!";
              for (let i = 0; i < unownChars.length; i++) {
                const char = unownChars[i];
                const formName = `unown-${char}`;
                if (!fullList.some((p: any) => p.name === formName)) {
                  extraForms.push({
                    name: formName,
                    id: `201-${char}`,
                    displayName: `Unown ${char.toUpperCase()}`,
                    url: ""
                  });
                }
              }
            }
          }
        });

        const sortedList = [...fullList, ...extraForms].sort((a, b) => {
          const parseId = (id: string) => {
            const parts = id.split('-');
            const num = parseInt(parts[0]);
            const form = parts.slice(1).join('-');
            return { num, form };
          };

          const idA = parseId(a.id);
          const idB = parseId(b.id);

          if (idA.num !== idB.num) {
            return idA.num - idB.num;
          }
          return idA.form.localeCompare(idB.form);
        });

        setPokemonList(sortedList);
      });

    // Load existing mapping if any
    const saved = localStorage.getItem("sprite-mapping");
    if (saved) {
      setMapping(JSON.parse(saved));
    }
  }, []);

  const currentSprite = sprites[currentIndex];

  const handleSave = () => {
    if (!selectedPokemonId) return;

    // Allow overwriting or adding
    const newMapping = { ...mapping, [selectedPokemonId]: currentSprite };
    setMapping(newMapping);
    localStorage.setItem("sprite-mapping", JSON.stringify(newMapping));

    toast({ title: "Mapped!", description: `Linked ${currentSprite} to Pokémon #${selectedPokemonId}` });

    // Auto advance
    if (currentIndex < sprites.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedPokemonId(""); // Reset selection
      setSearch("");
    }
  };

  const handleSkip = () => {
    if (currentIndex < sprites.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedPokemonId("");
      setSearch("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Try to recover mapping for previous if needed?
      // For now just navigation.
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapping, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sprite-mapping.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredPokemon = pokemonList
    .filter(p => (p.displayName || p.name).toLowerCase().includes(search.toLowerCase()) || p.id === search);

  const handleSelectNext = () => {
    if (filteredPokemon.length === 0) return;
    const currentIndex = filteredPokemon.findIndex(p => p.id === selectedPokemonId);
    if (currentIndex < filteredPokemon.length - 1) {
      setSelectedPokemonId(filteredPokemon[currentIndex + 1].id);
      // Optional: Scroll to item? Not easily possible with just state, need ref, but let's stick to selection for now.
    } else if (currentIndex === -1) {
      setSelectedPokemonId(filteredPokemon[0].id);
    }
  };

  const handleSelectPrev = () => {
    if (filteredPokemon.length === 0) return;
    const currentIndex = filteredPokemon.findIndex(p => p.id === selectedPokemonId);
    if (currentIndex > 0) {
      setSelectedPokemonId(filteredPokemon[currentIndex - 1].id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleSelectNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleSelectPrev();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedPokemonId) {
        handleSave();
      }
    }
  };

  useEffect(() => {
    if (selectedPokemonId) {
      const el = document.getElementById(`pokemon-item-${selectedPokemonId}`);
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedPokemonId]);

  if (loading) return <div className="p-8">Loading sprites... (Ensure public/sprites/index.json exists)</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Sprite Mapper ({currentIndex + 1} / {sprites.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">

          {/* Left: Image Display */}
          <div className="flex-1 flex flex-col items-center justify-center border rounded p-8 bg-slate-50 dark:bg-slate-900">
            <div className="text-sm text-muted-foreground mb-4">{currentSprite}</div>
            <img
              src={`/sprites/${currentSprite}`}
              alt="Current Sprite"
              className="w-32 h-32 object-contain pixelated rendering-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />

            <div className="flex gap-2 mt-8 w-full justify-center">
              <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>Previous</Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">File:</span>
                <select
                  className="bg-background border rounded px-2 py-1 text-sm w-32"
                  value={currentIndex}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    setCurrentIndex(newIndex);
                    setSelectedPokemonId("");
                    setSearch("");
                  }}
                >
                  {sprites.map((s, idx) => (
                    <option key={s} value={idx}>{s}</option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" onClick={handleSkip}>Skip</Button>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Find Pokémon (Name, ID, or Form)</Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSelectPrev} title="Previous (Up Arrow)">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSelectNext} title="Next (Down Arrow)">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Search (e.g. 'Unown', 'Deerling')..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <ScrollArea className="h-[300px] border rounded p-2">
              {filteredPokemon.length === 0 && <div className="text-center p-4 text-muted-foreground">No matches</div>}
              {filteredPokemon.map(p => (
                <div
                  key={p.id}
                  id={`pokemon-item-${p.id}`}
                  className={`p-2 cursor-pointer rounded flex justify-between items-center ${selectedPokemonId === p.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  onClick={() => setSelectedPokemonId(p.id)}
                >
                  <span className="capitalize">{p.displayName || p.name}</span>
                  <span className="opacity-50">#{p.id}</span>
                </div>
              ))}
            </ScrollArea>

            <div className="pt-4">
              <Button className="w-full" onClick={handleSave} disabled={!selectedPokemonId}>
                Link & Next
              </Button>
            </div>

            <div className="pt-8 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mapped: {Object.keys(mapping).length}</span>
                <Button variant="outline" onClick={handleExport}>Download JSON</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="font-bold mb-2">Instructions</h3>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>Review the image on the left.</li>
          <li>Search for the corresponding Pokémon on the right.</li>
          <li>Click the Pokémon to select it.</li>
          <li>Click "Link & Next" to save and move to the next image.</li>
          <li>Use "Skip" if it's not a Pokémon or you are unsure.</li>
          <li>When finished (or tired), click "Download JSON" and give the file to me!</li>
        </ul>
      </div>
    </div>
  );
}
