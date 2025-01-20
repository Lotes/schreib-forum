"use client";

import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import CopyAll from "@mui/icons-material/CopyAll";
import * as Diff from "diff";
import { TagNode, parse } from "@bbob/parser";

type Row = {
  oldCode: string;
  newCode: string;
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(1);
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [diffText, setDiffText] = useState<string>("");

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  useEffect(() => {
    const diffs = Diff.diffWords(oldText, newText);
    let currentRow: Row = {
      newCode: "",
      oldCode: ""
    };
    const rows: Row[] = [currentRow];

    function addPart(part0: string, added: boolean, removed: boolean) {
      if (removed) {
        currentRow.oldCode += `[rot]${part0}[/rot]`;
      } else if (added) {
        currentRow.newCode += `[gruen]${part0}[/gruen]`;
      } else {
        currentRow.oldCode += part0;
        currentRow.newCode += part0;
      }
    }

    for (const {added, removed, value} of diffs) {
      const parts = value.split("\n");
      addPart(parts[0], added, removed);
      for(let index=1; index<parts.length; index++)  {
        currentRow = {
          newCode: "",
          oldCode: "",
        };
        rows.push(currentRow);
        addPart(parts[index], added, removed);
      }
    }

    setDiffText(`[table][tr][th]Alter Text[/th][th]Neuer Text[/th][/tr]${rows.map(row => {
      return `[tr][td]${row.oldCode}[/td][td]${row.newCode}[/td][/tr]`;
    }).join("")}[/table]`);
  }, [oldText, newText]);

  return (
    <div className="min-w-[50%] w-full h-full items-center justify-items-center m-20 gap-4 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl text-center">Textdifferenz</h1>
      <main className="flex flex-col items-center w-full min-h-[50%]">
        <Box className="w-1/2 min-h-[50%] border-gray-300 border-[1px] flex flex-col">
          <Tabs value={tab} onChange={handleChange} className="w-full">
            <Tab label="Alter Text" value={1} />
            <Tab label="Neuer Text" value={2} />
            <Tab label="Vorschau" value={3} />
          </Tabs>
          {tab === 1 && (
            <Box className="m-2 flex flex-col flex-grow items-end min-h-[50%]">
              <textarea
                className="w-full h-full"
                rows={8}
                placeholder="Bitte füge hier die alte Fassung deines Textes ein."
                value={oldText}
                onChange={(e) => setOldText(e.currentTarget.value)}
              />
              <Button
                className="w-1/2"
                variant="contained"
                onClick={() => setTab(2)}
              >
                Weiter
              </Button>
            </Box>
          )}
          {tab === 2 && (
            <Box className="m-2 flex flex-grow flex-col min-h-[50%]">
              <textarea
                rows={8}
                className="w-full h-full"
                placeholder="Bitte füge hier die neue Fassung deines Textes ein."
                value={newText}
                onChange={(e) => setNewText(e.currentTarget.value)}
              />
              <Box className="gap-2 flex flex-row">
                <Button
                  className="w-1/2"
                  variant="outlined"
                  onClick={() => setTab(1)}
                >
                  Zurück
                </Button>
                <Button
                  className="w-1/2"
                  variant="contained"
                  onClick={() => setTab(3)}
                >
                  Weiter
                </Button>
              </Box>
            </Box>
          )}
          {tab === 3 && (
            <Box className="m-2 flex flex-grow flex-col min-h-[50%]">
              <div className="flex flex-col flex-grow">
                <BBCode bbCode={diffText} />
              </div>
              <Box className="gap-2 flex flex-row">
                <Button
                  className="w-1/2"
                  variant="outlined"
                  onClick={() => setTab(2)}
                >
                  Zurück
                </Button>
                <Button
                  className="w-1/2"
                  variant="contained"
                  onClick={() => {
                    setCopied(true);
                    navigator.clipboard.writeText(diffText);
                    setTimeout(() => {
                      setCopied(false);
                    }, 1000);
                  }}
                  startIcon={<CopyAll />}
                >
                  {!copied ? "Code" : "Kopiert!"}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </main>
      <footer className="flex items-center justify-center">
        Made with ❤️ by
        <a className="mx-1" href="https://github.com/Lotes" target="_blank">
          Lotes
        </a>
      </footer>
    </div>
  );
}

function TreeContent({content}: {content: TagNode['content']}) {
  if(content === null) {
    return <></>;
  } else if(Array.isArray(content)) {
    return <>
      {content.map((c, index) => <TreeContent key={index} content={c}/>)}
    </>
  } else switch(typeof content)   {
    case "number":
    case "string": return <>{content}</>;
    case "object": return <BBCodeTag node={content as TagNode}/>;
  }
}

function BBCodeTag({node}: {node:TagNode}) {
  switch (node.tag) {
    case "table": return <table className="w-full"><tbody><TreeContent content={node.content}/></tbody></table>;
    case "tr": return <tr><TreeContent content={node.content}/></tr>;
    case "td": return <td><TreeContent content={node.content}/></td>;
    case "th": return <th><TreeContent content={node.content}/></th>;
    case "rot": return <span className="text-red-500"><TreeContent content={node.content}/></span>;
    case "gruen": return <span className="text-green-500"><TreeContent content={node.content}/></span>;
    default: return <TreeContent content={node.content}/>
  }
}

function BBCode({ bbCode }: { bbCode: string }) {
  const [ast, setAst] = useState<TagNode[]>([]);
  useEffect(() => {
    setAst(parse(bbCode, { onlyAllowTags: ["gruen", "rot", "table", "tr", "td", "th"] }));
  }, [bbCode]);
  return <>{ast.map((n, i) => <BBCodeTag key={i} node={n}/>)}</> 
}