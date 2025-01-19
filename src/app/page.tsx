"use client";

import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import CopyAll from "@mui/icons-material/CopyAll";
import { makeDiff } from "@sanity/diff-match-patch";
import { TagNode, parse } from "@bbob/parser";

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
    const diffs = makeDiff(oldText, newText);
    setDiffText(
      diffs
        .map(([type, content]) => {
          if (type < 0) {
            return `[rot]${content}[/rot]`;
          } else if (type > 0) {
            return `[gruen]${content}[/gruen]`;
          } else {
            return content;
          }
        })
        .join("")
    );
  }, [oldText, newText]);

  return (
    <div className="flex flex-col min-w-[50%] max-w-full h-full items-center justify-items-center p-8 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl">Textdifferenz</h1>
      <main className="flex flex-col items-center w-full h-full">
        <Box className="w-full h-dvh border-gray-300 border-[1px] flex flex-col">
          <Tabs value={tab} onChange={handleChange} className="w-full">
            <Tab label="Alter Text" value={1} />
            <Tab label="Neuer Text" value={2} />
            <Tab label="Vorschau" value={3} />
          </Tabs>
          {tab === 1 && (
            <Box className="m-2 flex flex-col flex-grow items-end">
              <textarea
                className="w-full h-full"
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
            <Box className="m-2 flex flex-grow flex-col">
              <textarea
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
            <Box className="m-2 flex flex-grow flex-col">
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
                  {!copied?"Code":"Kopiert!"}
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

function BBCode({ bbCode }: { bbCode: string }) {
  const [ast, setAst] = useState<TagNode[]>([]);
  useEffect(() => {
    setAst(parse(bbCode, { onlyAllowTags: ["gruen", "rot"] }));
  }, [bbCode]);
  return (
    <Box className="">
      {ast.map((a, index) => {
        switch (a.tag) {
          case "rot":
            return <span key={index} className="bg-red-300 inline-block">{breakify(a.content!.toString())}</span>;
          case "gruen":
            return (
              <span key={index} className="bg-green-300 inline-block">{breakify(a.content!.toString())}</span>
            );
          default:
            return (
              <span key={index} className="inline-block">{breakify(a as unknown as string)}</span>
            );
        }
      })}
    </Box>
  );
}

function breakify(text:string) {
  return <>{text.split(/\n/g).map((t, i) => <span key={i}>{t}<br/></span>)}</>;
}