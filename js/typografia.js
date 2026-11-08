// Polska typografia: słowa z jednej lub dwóch liter (w, i, z, a, są, na, do, że, to…) nie zostają na końcu linii.
// Po takim słowie wstawiamy twardą spację, więc przechodzi do nowej linii razem z następnym słowem.
// Działa na całej stronie i na wszystkim, co pojawi się później (telefony, panel, bohaterki, dymki),
// więc nowe teksty nie wymagają pamiętania o tej zasadzie.

const NBSP = ' ';
// Słowo z 1–2 liter (także z polskimi znakami) na początku tekstu albo po spacji, nawiasie lub cudzysłowie,
// a za nim zwykła spacja
const SHORT = /(^|[\s(„"'«[])(\p{L}{1,2})[ \t\n\r]+/gu;
// Pól do pisania nie ruszamy: zmieniłoby to treść wpisaną przez użytkownika
const SKIP = new Set(['TEXTAREA', 'SCRIPT', 'STYLE', 'INPUT', 'CODE', 'PRE']);

// Kilka przebiegów, bo krótkie słowa stoją obok siebie: „i w domu”, „a to na” — każde skleja się z następnym
function fix(text) {
  let out = text;
  for (let i = 0; i < 4; i++) {
    const next = out.replace(SHORT, `$1$2${NBSP}`);
    if (next === out) break;
    out = next;
  }
  return out;
}

function fixNode(node) {
  const value = node.nodeValue;
  if (!value || !/\s/.test(value)) return;
  const parent = node.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.isContentEditable) return;
  const fixed = fix(value);
  if (fixed !== value) node.nodeValue = fixed;
}

function fixTree(root) {
  if (root.nodeType === Node.TEXT_NODE) return fixNode(root);
  if (root.nodeType !== Node.ELEMENT_NODE || SKIP.has(root.tagName)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) fixNode(node);
}

export function initTypography(root = document.body) {
  fixTree(root);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') fixNode(m.target);
      else m.addedNodes.forEach(fixTree);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
