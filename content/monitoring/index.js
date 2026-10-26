// Теми, для яких уже є моніторингова робота (content/monitoring/<id>.js).
export const MONITORING = ["mova", "znachennia", "synonimy", "omonimy", "zapozycheni", "arhaizmy", "vzhyvannia", "surzhyk", "frazeolohizmy", "frazslovnyk", "zvuky", "hrafika", "naholos", "eta", "cherhuvannia", "dzvinki", "vymova", "miaki", "miakyiznak", "apostrof", "pereniesennia", "mylozvuchnist", "sproshchennia", "pomylky", "slovospoluchennia", "vydyrechen", "osnova", "odnoskladni", "oznachennia", "dodatok", "obstavyna", "odnoridni", "skladne", "priamamova", "dialoh", "punktuatsiia", "spilkuvannia", "informatsiia", "typymovlennia", "chytannia", "zhanry"];

// Додаткові варіанти: окремий файл content/monitoring/<id>.js, окремий перемикач у вчителя (ключ t_<id>).
export const MON_EXTRA = [{ id: "apostrof2", topic: "apostrof", n: 2 }];

// Усі роботи теми: варіант 1 (файл <тема>.js) і додаткові
export const monWorks = (topic) => [...(MONITORING.includes(topic) ? [{ id: topic, topic, n: 1 }] : []), ...MON_EXTRA.filter((x) => x.topic === topic)];
export const monWork = (id) => (MONITORING.includes(id) ? { id, topic: id, n: 1 } : MON_EXTRA.find((x) => x.id === id));
