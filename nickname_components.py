import random

adjectives = [
    'Crazy', 'Speedy', 'Sleepy', 'Jumpy', 'Grumpy', 'Sneaky', 'Fluffy', 'Wobbly', 'Squeaky', 'Bouncy',
    'Zany', 'Quirky', 'Clumsy', 'Dapper', 'Sassy', 'Goofy', 'Loopy', 'Perky', 'Jolly', 'Wacky',
    'Eccentric', 'Flamboyant', 'Mischievous', 'Exuberant', 'Whimsical', 'Zealous', 'Bubbly', 'Vivacious',
    'Nimble', 'Dazzling', 'Jazzy', 'Peppy', 'Snazzy', 'Zippy', 'Swanky', 'Snappy', 'Chipper', 'Perky'
]

nouns = [
    'Spoon', 'Banana', 'Penguin', 'Unicorn', 'Potato', 'Noodle', 'Pickle', 'Llama', 'Waffle', 'Socks',
    'Toaster', 'Kazoo', 'Balloon', 'Mustache', 'Cactus', 'Teapot', 'Ukulele', 'Flamingo', 'Monocle', 'Banjo',
    'Spatula', 'Accordion', 'Harmonica', 'Tambourine', 'Bongo', 'Xylophone', 'Didgeridoo', 'Coconut',
    'Bagel', 'Gizmo', 'Doodad', 'Gizmo', 'Doohickey', 'Thingamajig', 'Whatchamacallit', 'Dinglehopper', 'Whirligig', 'Contraption'
]

animals = [
    'Elephant', 'Giraffe', 'Kangaroo', 'Octopus', 'Platypus', 'Flamingo', 'Hedgehog', 'Narwhal', 'Sloth', 'Koala',
    'Panda', 'Raccoon', 'Squirrel', 'Walrus', 'Penguin', 'Dolphin', 'Chameleon', 'Armadillo', 'Axolotl', 'Quokka',
    'Lemur', 'Capybara', 'Wombat', 'Pangolin', 'Tapir', 'Okapi', 'Manatee', 'Meerkat', 'Echidna', 'Dugong',
    'Aardvark', 'Numbat', 'Quokka', 'Tardigrade', 'Kinkajou', 'Binturong', 'Coatimundi', 'Fossa', 'Gerenuk', 'Aye-aye'
]

age_groups = [
    'Boomer', 'Millennial', 'GenZ', 'GenX', 'Zoomer', 'Youngster', 'Elder', 'Veteran', 'Rookie', 'Seasoned',
    'Timeless', 'Ageless', 'Retro', 'Futuristic', 'Classic', 'Vintage', 'Neo', 'Post-modern', 'Ancient', 'Primordial',
    'Eternal', 'Prehistoric', 'Antediluvian', 'Primeval', 'Archaic', 'Antique', 'Bygone', 'Everlasting', 'Perpetual', 'Immortal'
]

physical_traits = [
    'Tall', 'Short', 'Curly', 'Bald', 'Bearded', 'Freckled', 'Lanky', 'Petite', 'Muscular', 'Chubby',
    'Slim', 'Tattooed', 'Spectacled', 'Dimpled', 'Rosy', 'Pale', 'Tanned', 'Scarred', 'Pierced', 'Mustachioed',
    'Bushy-browed', 'Long-legged', 'Double-jointed', 'Ambidextrous', 'Heterochromatic', 'Pigeon-toed', 'Bow-legged',
    'Knock-kneed', 'Flat-footed', 'Double-jointed', 'Barrel-chested', 'Broad-shouldered', 'Narrow-waisted', 'High-cheekboned', 'Cleft-chinned'
]

civic_roles = [
    'Voter', 'Activist', 'Volunteer', 'Campaigner', 'Organizer', 'Lobbyist', 'Reformer', 'Advocate', 'Petitioner', 'Canvasser',
    'Delegate', 'Pollster', 'Watchdog', 'Whistleblower', 'Ombudsman', 'Mediator', 'Moderator', 'Fact-checker', 'Analyst', 'Pundit',
    'Grassroots', 'Diplomat', 'Negotiator', 'Peacekeeper', 'Arbiter', 'Facilitator', 'Liaison', 'Envoy', 'Emissary', 'Attaché'
]

professions = [
    'Wizard', 'Ninja', 'Pirate', 'Astronaut', 'Chef', 'Scientist', 'Detective', 'Superhero', 'Explorer', 'Inventor',
    'Archaeologist', 'Magician', 'Acrobat', 'Spy', 'Pilot', 'Cowboy', 'Samurai', 'Viking', 'Knight', 'Gladiator',
    'Alchemist', 'Time-traveler', 'Dragonrider', 'Beastmaster', 'Shapeshifter', 'Necromancer', 'Puppeteer', 'Stuntperson',
    'Cryptozoologist', 'Quantum Mechanic', 'Dreamweaver', 'Starship Captain', 'Dimension Hopper', 'Meme Lord', 'Cyborg Whisperer'
]

political_leanings = [
    'Centrist', 'Moderate', 'Progressive', 'Conservative', 'Liberal', 'Libertarian', 'Green', 'Independent',
    'Swing', 'Undecided', 'Bipartisan', 'Nonpartisan', 'Maverick', 'Radical', 'Reformist', 'Traditionalist',
    'Populist', 'Technocrat', 'Anarchist', 'Monarchist', 'Federalist', 'Constitutionalist', 'Egalitarian', 'Utilitarian',
    'Pragmatist', 'Idealist', 'Realist', 'Opportunist', 'Pluralist', 'Nationalist'
]

mythical_creatures = [
    'Dragon', 'Phoenix', 'Unicorn', 'Griffin', 'Mermaid', 'Centaur', 'Minotaur', 'Chimera', 'Kraken', 'Pegasus',
    'Basilisk', 'Gorgon', 'Hydra', 'Sphinx', 'Nymph', 'Siren', 'Gryphon', 'Griffon', 'Wyvern', 'Chimera',
    'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee', 'Banshee'
]

emotions = [
    'Joyful', 'Sad', 'Angry', 'Happy', 'Excited', 'Anxious', 'Content', 'Bored', 'Tired', 'Energetic',
    'Relaxed', 'Stressed', 'Confused', 'Curious', 'Frustrated', 'Disappointed', 'Hopeful', 'Optimistic', 'Pessimistic', 'Indifferent'
]

celestial_bodies = [
    'Sun', 'Moon', 'Star', 'Planet', 'Comet', 'Asteroid', 'Meteor', 'Galaxy', 'Constellation', 'Black Hole',
    'Supernova', 'Nebula', 'Quasar', 'Pulsar', 'Exoplanet', 'Dwarf Planet', 'Meteor Shower', 'Solar Eclipse', 'Lunar Eclipse', 'Zodiac'
]

elements = [
    'Fire', 'Water', 'Earth', 'Air', 'Metal', 'Wood', 'Ice', 'Lava', 'Steam', 'Mud',
    'Sand', 'Rock', 'Smoke', 'Fog', 'Ash', 'Dust', 'Mist', 'Vapor', 'Plasma', 'Energy'
]

colors = [
    'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White',
    'Gray', 'Silver', 'Gold', 'Bronze', 'Turquoise', 'Lime', 'Magenta', 'Indigo', 'Violet', 'Cyan'
]

comic_characters = [
    'Batman', 'Superman', 'Spider-Man', 'Wonder Woman', 'Iron Man', 'Captain America', 'Hulk', 'Thor',
    'Wolverine', 'Deadpool', 'Black Widow', 'Green Lantern', 'Flash', 'Catwoman', 'Joker', 'Harley Quinn',
    'Black Panther', 'Storm', 'Cyclops', 'Jean Grey', 'Professor X', 'Magneto', 'Thanos', 'Loki'
]

movie_characters = [
    'Luke Skywalker', 'Darth Vader', 'Han Solo', 'Indiana Jones', 'James Bond', 'Sherlock Holmes',
    'Harry Potter', 'Hermione Granger', 'Frodo Baggins', 'Gandalf', 'Neo', 'Morpheus', 'Jack Sparrow',
    'Marty McFly', 'Doc Brown', 'Terminator', 'Ellen Ripley', 'John McClane', 'Forrest Gump', 'Tony Stark'
]

book_characters = [
    'Sherlock Holmes', 'Hercule Poirot', 'Katniss Everdeen', 'Holden Caulfield', 'Atticus Finch',
    'Elizabeth Bennet', 'Mr. Darcy', 'Huckleberry Finn', 'Tom Sawyer', 'Bilbo Baggins', 'Gandalf'
]

nickname_types = [
    (adjectives, animals),
    (adjectives, book_characters),
    (adjectives, celestial_bodies),
    (adjectives, colors),
    (adjectives, comic_characters),
    (adjectives, elements),
    (adjectives, movie_characters),
    (adjectives, mythical_creatures),
    (adjectives, nouns),
    (adjectives, professions),
    (age_groups, animals),
    (age_groups, book_characters),
    (age_groups, celestial_bodies),
    (age_groups, colors),
    (age_groups, comic_characters),
    (age_groups, elements),
    (age_groups, movie_characters),
    (age_groups, mythical_creatures),
    (age_groups, nouns),
    (age_groups, political_leanings),
    (age_groups, professions),
    (book_characters, animals),
    (book_characters, nouns),
    (book_characters, professions),
    (celestial_bodies, animals),
    (celestial_bodies, book_characters),
    (celestial_bodies, comic_characters),
    (celestial_bodies, movie_characters),
    (celestial_bodies, mythical_creatures),
    (celestial_bodies, nouns),
    (celestial_bodies, professions),
    (civic_roles, animals),
    (civic_roles, book_characters),
    (civic_roles, celestial_bodies),
    (civic_roles, colors),
    (civic_roles, comic_characters),
    (civic_roles, elements),
    (civic_roles, movie_characters),
    (civic_roles, mythical_creatures),
    (civic_roles, nouns),
    (civic_roles, professions),
    (colors, animals),
    (colors, celestial_bodies),
    (colors, comic_characters),
    (colors, elements),
    (colors, mythical_creatures),
    (colors, nouns),
    (colors, professions),
    (comic_characters, animals),
    (comic_characters, book_characters),
    (comic_characters, movie_characters),
    (comic_characters, nouns),
    (comic_characters, professions),
    (elements, animals),
    (elements, book_characters),
    (elements, celestial_bodies),
    (elements, comic_characters),
    (elements, movie_characters),
    (elements, mythical_creatures),
    (elements, nouns),
    (elements, professions),
    (emotions, animals),
    (emotions, book_characters),
    (emotions, celestial_bodies),
    (emotions, colors),
    (emotions, comic_characters),
    (emotions, elements),
    (emotions, movie_characters),
    (emotions, mythical_creatures),
    (emotions, nouns),
    (emotions, professions),
    (movie_characters, animals),
    (movie_characters, book_characters),
    (movie_characters, nouns),
    (movie_characters, professions),
    (mythical_creatures, animals),
    (mythical_creatures, book_characters),
    (mythical_creatures, comic_characters),
    (mythical_creatures, movie_characters),
    (mythical_creatures, nouns),
    (mythical_creatures, professions),
    (physical_traits, animals),
    (physical_traits, book_characters),
    (physical_traits, celestial_bodies),
    (physical_traits, colors),
    (physical_traits, comic_characters),
    (physical_traits, elements),
    (physical_traits, movie_characters),
    (physical_traits, mythical_creatures),
    (physical_traits, nouns),
    (physical_traits, political_leanings),
    (physical_traits, professions),
    (political_leanings, animals),
    (political_leanings, book_characters),
    (political_leanings, celestial_bodies),
    (political_leanings, colors),
    (political_leanings, comic_characters),
    (political_leanings, elements),
    (political_leanings, movie_characters),
    (political_leanings, mythical_creatures),
    (political_leanings, nouns),
    (political_leanings, professions)
]