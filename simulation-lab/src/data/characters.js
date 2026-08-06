/**
 * @module Characters
 * Character asset pools and configurations for AI partner visuals.
 * Contains all layered image paths for heads, clothes, hair, and accessories.
 */

/**
 * Base directory for all character-related image assets.
 * @constant {string}
 */
export const BASE_PATH = "src/assets/Character/";

/**
 * Shared head assets for female characters to reduce redundancy.
 */
export const SHARED_FEMALE_HEADS = [
    "HeadImages/Head_1/Head_1_a.png",
    "HeadImages/Head_1/Head_1_b.png",
    "HeadImages/Head_1/Head_1_c.png",
    "HeadImages/Head_1/Head_1_d.png",
];

/**
 * Shared head assets for male characters to reduce redundancy.
 */
export const SHARED_MALE_HEADS = [
    "HeadImages/Head_1/Head_1_a.png",
    "HeadImages/Head_1/Head_1_b.png",
    "HeadImages/Head_1/Head_1_c.png",
    "HeadImages/Head_1/Head_1_d.png",
    "HeadImages/Head_2/Head_2_a.png",
    "HeadImages/Head_2/Head_2_b.png",
    "HeadImages/Head_2/Head_2_c.png",
    "HeadImages/Head_2/Head_2_d.png",
];

/**
 * @typedef {Object} CharacterProfile
 * @property {string} gender - The gender of the character ('male' or 'female').
 * @property {string} basePath - The base path for asset resolution.
 * @property {string[]} heads - Array of paths for head/face base images.
 * @property {string[]} clothes - Array of paths for clothing layers.
 * @property {string[]} hair - Array of paths for hairstyle layers.
 * @property {string[]} glasses - Array of paths for eyewear (or empty strings for none).
 * @property {string[]} headset - Array of paths for headset/communication gear.
 * @property {Object.<string, string[]>|string[]} hands - Hand images, either as a simple array or mapped by skin tone (a, b, c, d).
 * @property {string[]} eyesOpen - Array of paths for open eye states.
 * @property {string[]} eyesClosed - Array of paths for closed eye states (blinking).
 * @property {string[]} mouthsClosed - Array of paths for neutral/closed mouth states.
 * @property {string[]} mouthsOpen - Array of paths for open/speaking mouth states.
 */

/**
 * Collection of female character configurations.
 * These are used as base sets that can be shared across multiple roles.
 * @type {CharacterProfile[]}
 */
export const FEMALE_CHARACTERS = [
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
        heads: SHARED_FEMALE_HEADS,
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
        heads: SHARED_FEMALE_HEADS,
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
        heads: SHARED_FEMALE_HEADS,
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

/**
 * Collection of male character configurations.
 * @type {CharacterProfile[]}
 */
export const MALE_CHARACTERS = [
    {
        gender: "male",
        basePath: BASE_PATH,
        heads: SHARED_MALE_HEADS,
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
        heads: SHARED_MALE_HEADS,
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
        heads: SHARED_MALE_HEADS,
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

/**
 * Combined pool of all available characters for maximum randomization.
 * @type {CharacterProfile[]}
 */
export const ALL_CHARACTERS = [...FEMALE_CHARACTERS, ...MALE_CHARACTERS];