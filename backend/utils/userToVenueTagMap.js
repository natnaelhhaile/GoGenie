const userToVenueTagMap = {
    // 🟣 Hobbies → Venue Tags
    "Reading Books": ["bookstore", "cafecoffeeandteahouse"],
    "Hiking & Nature Walks": ["park", "urbanpark", "landmarksandoutdoors"],
    "Watching Movies / Series": ["movietheater", "cafecoffeeandteahouse"],
    "Playing Video Games": ["amusementpark", "entertainmentservice"],
    "Attending Live Music Events": ["musicvenue", "bar", "pub"],
    "Practicing Yoga / Meditation": ["yogastudio", "spa"],
    "Photography": ["artgallery", "park", "landmarksandoutdoors"],
    "Painting / Drawing": ["artschool", "artgallery"],
    "Playing Sports": ["sportsclub", "basketballcourt", "recreationcenter"],
    "Cooking / Baking": ["restaurant", "cafecoffeeandteahouse"],
    "Dancing": ["nightclub", "dancestudio"],
    "Writing / Journaling": ["bookstore", "cafecoffeeandteahouse"],
    "DIY & Crafting": ["hardwarestore", "retail"],
    "Traveling / Exploring New Places": ["museum", "landmarksandoutdoors", "restaurant"],
    "Learning Languages": ["library", "bookstore"],
    "Board Games / Puzzles": ["cafecoffeeandteahouse", "restaurant"],
    "Volunteering / Community Events": ["nonprofitorganization", "youthorganization"],
    "Fashion & Styling": ["clothingstore", "fashionaccessoriesstore"],
    "Gardening": ["flowerstore", "landscaperandgardener"],

    // 🟢 Food Preferences → Venue Tags
    "Vegetarian": ["veganandvegetarianrestaurant"],
    "Vegan": ["veganandvegetarianrestaurant"],
    "Gluten-Free": ["healthandmedicine"], // proxy, refine later
    "Halal": ["pakistanirestaurant", "indianrestaurant", "turkishrestaurant"],
    "Kosher": ["mediterraneanrestaurant", "grocery"], // generic match
    "Keto / Low Carb": ["nutritionist", "healthandmedicine"],
    "Organic / Farm-to-Table": ["grocerystore", "restaurant"],
    "Spicy Food Lover": ["koreanrestaurant", "thaiRestaurant", "indianrestaurant"],
    "Seafood Lover": ["restaurant"],
    "Dessert Lover": ["dessertshop", "icecreamparlor", "bakery"],
    "East Asian Cuisine": ["chineserestaurant", "japaneserestaurant", "koreanrestaurant", "vietnameserestaurant"],
    "Middle Eastern Cuisine": ["turkishrestaurant", "mediterraneanrestaurant"],
    "West African Cuisine": ["restaurant"], // proxy
    "East African Cuisine": ["restaurant"], // proxy
    "Latin American Cuisine": ["mexicanrestaurant", "venezuelanrestaurant", "latinamericanrestaurant"],
    "Indian Cuisine": ["indianrestaurant"],
    "Fast Food Fan": ["fastfoodrestaurant", "burgerjoint"],
    "Coffee Addict": ["coffeeshop", "cafecoffeeandteahouse"],
    "Bubble Tea Lover": ["bubbleteashop"],
    "Street Food Enthusiast": ["streetfoodgathering", "foodtruck"],

    // 🔵 Thematic Interests → Venue Tags
    "Cozy / Quiet Places": ["cafecoffeeandteahouse", "bookstore"],
    "Artistic / Creative Spaces": ["artgallery", "artschool"],
    "Bookstore Cafes": ["bookstore", "cafecoffeeandteahouse"],
    "Historical / Culturally Rich Locations": ["museum", "publicart"],
    "Nature / Scenic Spots": ["urbanpark", "park"],
    "Modern & Trendy Spots": ["restaurant", "coffeeshop", "artgallery"],
    "Tech-Friendly Cafes (with Wi-Fi & outlets)": ["coffeeshop", "technologybusiness"],
    "LGBTQ+ Friendly": ["bar", "entertainmentservice"],
    "Live Music & Jam Nights": ["musicvenue", "pub", "nightclub"],
    "Family-Friendly": ["restaurant", "recreationcenter"],
    "Study-Friendly": ["library", "coffeeshop"],
    "Rooftop / Outdoor Seating": ["bar", "restaurant"],
    "Instagrammable Spots": ["artgallery", "publicart"],
    "Pet-Friendly Venues": ["park", "dogpark"],
    "Karaoke / Game Nights": ["nightclub", "entertainmentservice"],
    "Dance or Music Events": ["musicvenue", "dancestudio"],
    "International Cuisine Hotspots": [
        "asianrestaurant", "mexicanrestaurant", "italianrestaurant", "latinamericanrestaurant"
    ],
    "Local Hidden Gems": ["restaurant", "pub"],

    // 🟠 Lifestyle Preferences → Venue Tags
    "College Student": ["collegeanduniversity", "fastfoodrestaurant", "coffeeshop"],
    "Working Professional": ["officebuilding", "restaurant", "coffeeshop"],
    "Parents with Kids": ["playground", "restaurant"],
    "Solo Explorer": ["bookstore", "urbanpark", "coffeeshop"],
    "Young Adults (18–25)": ["bar", "nightclub", "coffeeshop"],
    "Adults (26–40)": ["restaurant", "bar"],
    "Midlife Adults (41–60)": ["restaurant", "cafe"],
    "Seniors": ["restaurant", "park"],
    "Digital Nomad": ["coffeeshop", "technologybusiness"],
    "Couple-Friendly Spots": ["romanticrestaurant", "dessertshop"], // proxy
    "Group Hangouts": ["pub", "restaurant"],
    "First-Date Ideas": ["dessertshop", "artgallery"],
    "Budget-Friendly": ["fastfoodrestaurant", "bubbleteashop"],
    "Luxury / Upscale": ["steakhouse", "frenchrestaurant", "cocktailbar"]
};

export default userToVenueTagMap;