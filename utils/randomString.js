const randomString = () => {
  const randomString = Array.from(Array(10), () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");

  return randomString;
};

module.exports = { randomString };
