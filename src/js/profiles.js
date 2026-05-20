/**
 * Definition der Charakter-Pools und deren Zuordnung zu Rollen
 */

const BASE_PATH = "src/assets/Character/";

// Gemeinsame Charakter-Sets (Bases), die von verschiedenen Rollen genutzt werden können
const FEMALE_CHARACTERS = [
  {
    gender: "female",
    basePath: BASE_PATH,
    heads: ["HeadImages/Einstieg_Head_1.png"],
    clothes: ["ClothesImages/Einstieg/Einstieg_Clothes_1.png"],
    hair: ["HairImages/Einstieg/Einstieg_Hair_1.png"],
    glasses: [""],
    headset: [""],
    hands: {
      a: [""],
      b: [""],
      c: [""],
      d: [""],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Strong_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Strong_Smiling_Speaking.png"],
  },
  {
    gender: "female",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
    ],
    clothes: [
      "ClothesImages/Mutter/Mutter_Clothes_1.png",
      "ClothesImages/Mutter/Mutter_Clothes_2.png",
      "ClothesImages/Mutter/Mutter_Clothes_3.png",
      "ClothesImages/Mutter/Mutter_Clothes_4.png",
    ],
    hair: [
      "HairImages/Mutter/Mutter_Hair_1.png",
      "HairImages/Mutter/Mutter_Hair_2.png",
      "HairImages/Mutter/Mutter_Hair_3.png",
      "HairImages/Mutter/Mutter_Hair_4.png",
    ],
    glasses: [""],
    headset: [""],
    hands: {
      a: ["HandsImages/Mutter/Mutter_Hands_2_a.png"],
      b: [
        "HandsImages/Mutter/Mutter_Hands_1_b.png",
        "HandsImages/Mutter/Mutter_Hands_4_b.png",
      ],
      c: ["HandsImages/Mutter/Mutter_Hands_3_c.png"],
      d: [""],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Fine_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Fine_Smiling_Speaking.png"],
  },
  {
    gender: "female",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Honorar/Honorar_Clothes_1.png",
      "ClothesImages/Honorar/Honorar_Clothes_2.png",
      "ClothesImages/Honorar/Honorar_Clothes_3.png",
      "ClothesImages/Honorar/Honorar_Clothes_4.png",
    ],
    hair: [
      "HairImages/Honorar/Honorar_Hair_1.png",
      "HairImages/Honorar/Honorar_Hair_2.png",
      "HairImages/Honorar/Honorar_Hair_3.png",
    ],
    glasses: [""],
    headset: [""],
    hands: {
      a: [""],
      b: [""],
      c: [""],
      d: [""],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Fine_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Fine_Smiling_Speaking.png"],
  },
  {
    gender: "female",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Notarin/Notarin_Clothes_1.png",
      "ClothesImages/Notarin/Notarin_Clothes_2.png",
      "ClothesImages/Notarin/Notarin_Clothes_3.png",
      "ClothesImages/Notarin/Notarin_Clothes_4.png",
    ],
    hair: [
      "HairImages/Notarin/Notarin_Hair_1.png",
      "HairImages/Notarin/Notarin_Hair_2.png",
      "HairImages/Notarin/Notarin_Hair_3.png",
    ],
    glasses: [""],
    headset: ["ClothesImages/Notarin/Notarin_Headset.png"],
    hands: {
      a: [""],
      b: [""],
      c: [""],
      d: [""],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Fine_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Fine_Smiling_Speaking.png"],
  },
  {
    gender: "female",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Presse/Presse_Clothes_1.png",
      "ClothesImages/Presse/Presse_Clothes_2.png",
      "ClothesImages/Presse/Presse_Clothes_3.png",
      "ClothesImages/Presse/Presse_Clothes_4.png",
    ],
    hair: [
      "HairImages/Presse/Presse_Hair_1.png",
      "HairImages/Presse/Presse_Hair_2.png",
      "HairImages/Presse/Presse_Hair_3.png",
    ],
    glasses: [""],
    headset: [""],
    hands: {
      a: ["HandsImages/Presse/Presse_Hands_1.png"],
      b: ["HandsImages/Presse/Presse_Hands_2.png"],
      c: ["HandsImages/Presse/Presse_Hands_3.png"],
      d: ["HandsImages/Presse/Presse_Hands_4.png"],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Fine_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Fine_Smiling_Speaking.png"],
  },
  // Hier weitere weibliche Charakter-Modelle hinzufügen
];

const MALE_CHARACTERS = [
  {
    gender: "male",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Vater/Vater_Clothes_1.png",
      "ClothesImages/Vater/Vater_Clothes_2.png",
      "ClothesImages/Vater/Vater_Clothes_3.png",
      "ClothesImages/Vater/Vater_Clothes_4.png",
    ],
    hair: [
      "HairImages/Vater/Vater_Hair_1.png",
      "HairImages/Vater/Vater_Hair_2.png",
      "HairImages/Vater/Vater_Hair_3.png",
      "HairImages/Vater/Vater_Hair_4.png",
    ],
    glasses: ["GlassesImages/Glasses.png"],
    headset: [""],
    hands: {
      a: [""],
      b: [""],
      c: [""],
      d: [""],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Strong_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Strong_Smiling_Speaking.png"],
  },
  {
    gender: "male",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Investor/Investor_Clothes_1.png",
      "ClothesImages/Investor/Investor_Clothes_2.png",
      "ClothesImages/Investor/Investor_Clothes_3.png",
      "ClothesImages/Investor/Investor_Clothes_4.png",
    ],
    hair: [
      "HairImages/Investor/Investor_Hair_1.png",
      "HairImages/Investor/Investor_Hair_2.png",
      "HairImages/Investor/Investor_Hair_3.png",
      "HairImages/Investor/Investor_Hair_4.png",
    ],
    glasses: [""],
    headset: [""],
    hands: {
      a: ["HandsImages/Investor/Investor_Hands_a.png"],
      b: ["HandsImages/Investor/Investor_Hands_b.png"],
      c: ["HandsImages/Investor/Investor_Hands_c.png"],
      d: ["HandsImages/Investor/Investor_Hands_d.png"],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Strong_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Strong_Smiling_Speaking.png"],
  },
  {
    gender: "male",
    basePath: BASE_PATH,
    heads: [
      "HeadImages/Head_1/Head_1_a.png",
      "HeadImages/Head_1/Head_1_b.png",
      "HeadImages/Head_1/Head_1_c.png",
      "HeadImages/Head_1/Head_1_d.png",
      "HeadImages/Head_2/Head_2_a.png",
      "HeadImages/Head_2/Head_2_b.png",
      "HeadImages/Head_2/Head_2_c.png",
      "HeadImages/Head_2/Head_2_d.png",
    ],
    clothes: [
      "ClothesImages/Bank/Bank_Clothes_1.png",
      "ClothesImages/Bank/Bank_Clothes_2.png",
      "ClothesImages/Bank/Bank_Clothes_3.png",
      "ClothesImages/Bank/Bank_Clothes_4.png",
    ],
    hair: [
      "HairImages/Bank/Bank_Hair_1.png",
      "HairImages/Bank/Bank_Hair_2.png",
      "HairImages/Bank/Bank_Hair_3.png",
      "HairImages/Bank/Bank_Hair_4.png",
    ],
    glasses: [""],
    headset: [""],
    hands: {
      a: ["HandsImages/Bank/Bank_Hands_a.png"],
      b: ["HandsImages/Bank/Bank_Hands_b.png"],
      c: ["HandsImages/Bank/Bank_Hands_c.png"],
      d: ["HandsImages/Bank/Bank_Hands_d.png"],
    },
    eyesOpen: ["EyesImages/Eyes_Open.png"],
    eyesClosed: ["EyesImages/Eyes_Closed.png"],
    mouthsClosed: ["FaceImages/Smiling/Strong_Smiling.png"],
    mouthsOpen: ["FaceImages/Smiling/Strong_Smiling_Speaking.png"],
  },
  // Hier weitere männliche Charakter-Modelle hinzufügen
];

// Kombinierter Pool für maximale Zufälligkeit
const ALL_CHARACTERS = [...FEMALE_CHARACTERS, ...MALE_CHARACTERS];

/**
 * Exportiert die Profile-Map.
 * Der Key entspricht dem 'role_label' oder 'roleName' aus dem Szenario.
 */
export const CHARACTER_PROFILES = {
  // Rollen-Zuweisungen
  Mitarbeiterin: FEMALE_CHARACTERS,
  Kollegin: FEMALE_CHARACTERS,
  Mitarbeiter: MALE_CHARACTERS,
  Kollege: MALE_CHARACTERS,
  Teammitglied: MALE_CHARACTERS,
  Trainer: ALL_CHARACTERS,

  // Fallback
  default: ALL_CHARACTERS,
};

/**
 * Findet den passenden Profil-Pool für einen Key oder liefert den Default-Pool.
 * @param {string} key - Der Rollenname oder das Label.
 */
export const getProfilePool = (key) => {
  return CHARACTER_PROFILES[key] || CHARACTER_PROFILES["default"];
};
