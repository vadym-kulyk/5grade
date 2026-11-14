#!/usr/bin/env python3
"""Підручник (PDF) → текст по сторінках, щоб звіряти завдання з підручником.

Якщо в PDF є текстовий шар — береться він (безкоштовно, pdftotext).
Сторінки-скани розпізнає дешева модель через Abacus RouteLLM
(ключ підставляє проксі середовища; змінна ABACUS_API_KEY не потрібна).

Використання:
  python3 tools/ocr_textbook.py підручник.pdf out_dir [--from 1] [--to 300] [--model claude-haiku-5-5]
Результат: out_dir/p0001.txt, p0002.txt, … (уже готові сторінки пропускаються).
"""
import argparse, base64, json, os, subprocess, sys, tempfile, urllib.request

API = "https://routellm.abacus.ai/v1/chat/completions"
PROMPT = ("Перепиши весь текст зі сторінки українського підручника дослівно, зберігаючи "
          "правопис, апострофи, наголоси та розбивку на абзаци й вправи. Нічого не виправляй "
          "і не додавай пояснень. Таблиці — рядками через ' | '.")


def text_layer(pdf, page):
    r = subprocess.run(["pdftotext", "-f", str(page), "-l", str(page), "-layout", pdf, "-"],
                       capture_output=True, text=True)
    return r.stdout.strip()


def ocr(pdf, page, model):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", "150", "-jpeg",
                        "-singlefile", pdf, os.path.join(d, "p")], check=True)
        img = base64.b64encode(open(os.path.join(d, "p.jpg"), "rb").read()).decode()
    body = {"model": model, "messages": [{"role": "user", "content": [
        {"type": "text", "text": PROMPT},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + img}}]}]}
    req = urllib.request.Request(API, json.dumps(body).encode(), {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + os.environ.get("ABACUS_API_KEY", "proxy-injected")})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)["choices"][0]["message"]["content"].strip()


def pages(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    return int(next(l.split()[-1] for l in out.splitlines() if l.startswith("Pages:")))


def main():
    a = argparse.ArgumentParser()
    a.add_argument("pdf"); a.add_argument("out")
    a.add_argument("--from", dest="first", type=int, default=1)
    a.add_argument("--to", dest="last", type=int, default=0)
    a.add_argument("--model", default="claude-haiku-5-5")
    a = a.parse_args()
    os.makedirs(a.out, exist_ok=True)
    last = a.last or pages(a.pdf)
    for p in range(a.first, last + 1):
        f = os.path.join(a.out, f"p{p:04d}.txt")
        if os.path.exists(f):
            continue
        t = text_layer(a.pdf, p)
        src = "text"
        if len(t) < 200:  # майже порожньо — це скан
            t, src = ocr(a.pdf, p, a.model), "ocr"
        open(f, "w", encoding="utf-8").write(t + "\n")
        print(f"p{p}: {src}, {len(t)} симв.", file=sys.stderr)


if __name__ == "__main__":
    main()
