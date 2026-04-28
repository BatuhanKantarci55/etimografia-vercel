// Avatar görsellerini import et (profildeki gibi)
export const allAvatars = [
  require("../assets/images/avatars/cat1.jpg"),
  require("../assets/images/avatars/cat2.jpg"),
  require("../assets/images/avatars/chicken1.png"),
  require("../assets/images/avatars/cockatiel1.png"),
  require("../assets/images/avatars/cow1.png"),
  require("../assets/images/avatars/dolphin1.jpg"),
  require("../assets/images/avatars/donkey1.png"),
  require("../assets/images/avatars/duck1.png"),
  require("../assets/images/avatars/elephant1.jpg"),
  require("../assets/images/avatars/fox1.png"),
  require("../assets/images/avatars/horse1.png"),
  require("../assets/images/avatars/jellyfish1.jpg"),
  require("../assets/images/avatars/kakadu1.png"),
  require("../assets/images/avatars/octopus1.jpg"),
  require("../assets/images/avatars/penguen1.jpg"),
  require("../assets/images/avatars/penguen2.jpg"),
  require("../assets/images/avatars/pigeon1.png"),
  require("../assets/images/avatars/polarbear1.jpg"),
  require("../assets/images/avatars/sheep1.png"),
];

export const getAvatarSource = (avatarIndex: number) => {
  const index = avatarIndex % allAvatars.length;
  return allAvatars[index];
};
