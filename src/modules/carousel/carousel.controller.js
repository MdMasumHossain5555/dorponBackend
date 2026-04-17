const Carousel = require("./carousel.model");

exports.getCarousel = async (req, res) => {
  const carousels = await Carousel.find();
  res.json(carousels);
};

exports.addCarousel = async (req, res) => {
  const { image } = req.body;
  const carousel = new Carousel({ image });
  await carousel.save();
  res.status(201).json(carousel);
};
