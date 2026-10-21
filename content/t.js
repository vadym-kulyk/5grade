// Короткі конструктори завдань для файлів тем.
export const ch = (id, q, options, answer, rule, explain) => ({ id, type: "choice", q, options, answer, rule, explain });
export const tf = (id, q, answer, rule, explain) => ({ id, type: "tf", q, answer, rule, explain });
export const mu = (id, q, options, answer, rule, explain) => ({ id, type: "multi", q, options, answer, rule, explain });
export const inp = (id, q, answer, rule, explain) => ({ id, type: "input", q, answer: [].concat(answer), rule, explain });
export const gp = (id, word, options, answer, rule, explain, q) => ({ id, type: "gap", q, word, options, answer, rule, explain });
export const mt = (id, q, pairs, rule, explain) => ({ id, type: "match", q, pairs, rule, explain });
export const so = (id, q, groups, items, rule, explain) => ({ id, type: "sort", q, groups, items, rule, explain });
export const pk = (id, q, text, rule, explain) => ({ id, type: "pick", q, text, rule, explain });
export const od = (id, q, items, rule, explain, joiner = " ") => ({ id, type: "order", q, items, joiner, rule, explain });
