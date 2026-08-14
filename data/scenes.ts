export type WeatherMode = "clear" | "rain" | "fog";

export interface DriveScene {
  id: string;
  name: string;
  location: string;
  video?: string;
  image: string;
  mobileImage?: string;
  objectPosition: string;
  mobilePosition: string;
  weather: WeatherMode;
  tone: "night" | "road" | "industrial";
}

export const scenes: DriveScene[] = [
  { id: "night-city", name: "Night Drive", location: "City lights", video: "/videos/ferrari-night-drive.mp4", image: "/images/ferrari/night-city.jpg", mobileImage: "/images/ferrari/road-mobile.jpg", objectPosition: "50% 52%", mobilePosition: "58% 50%", weather: "clear", tone: "night" },
  { id: "road-motion", name: "Open Road", location: "Garden route", image: "/images/ferrari/road-motion.jpg", mobileImage: "/images/ferrari/road-mobile.jpg", objectPosition: "52% 50%", mobilePosition: "50% 48%", weather: "clear", tone: "road" },
  { id: "industrial", name: "After Hours", location: "Industrial district", image: "/images/ferrari/industrial-detail.jpg", objectPosition: "53% 54%", mobilePosition: "58% 50%", weather: "fog", tone: "industrial" },
];

export const defaultScene = scenes[0];
