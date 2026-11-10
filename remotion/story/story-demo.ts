import type { RenderProps } from "./types";
export const STORY_DEMO: RenderProps = {
  "storyboard": {
    "version": 1,
    "title": "Story mode visual demo (provisional timing)",
    "fps": 60,
    "duration": 54,
    "language": "en",
    "cast": {
      "bob": {
        "preset": "thief",
        "name": "Bob"
      },
      "officer": {
        "preset": "policeman"
      },
      "dog": {
        "kind": "dog",
        "look": {
          "skin": "#c58c58",
          "accent": "#e53950"
        }
      },
      "cat": {
        "kind": "cat",
        "look": {
          "skin": "#e8a451"
        }
      },
      "bird": {
        "kind": "bird",
        "look": {
          "skin": "#3b8df0"
        }
      },
      "girl": {
        "preset": "schoolgirl"
      },
      "friend": {
        "preset": "buddy"
      },
      "farmer": {
        "preset": "farmer"
      }
    },
    "scenes": [
      {
        "id": "plan",
        "start": 0,
        "end": 6,
        "layout": "story",
        "bg": "house_exterior",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.4,
            "size": 0.42,
            "pose": "hold",
            "expression": "smug",
            "holding": "moneybag"
          }
        ],
        "title": "The perfect plan"
      },
      {
        "id": "inside",
        "start": 6,
        "end": 12,
        "layout": "story",
        "bg": "living_room",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.25,
            "size": 0.4,
            "pose": "scared",
            "expression": "shocked",
            "move": [
              {
                "at": 1,
                "duration": 2,
                "x": 0.5
              }
            ]
          }
        ],
        "title": "Inside the house",
        "props": [
          {
            "name": "seedling",
            "x": 0.55,
            "y": 0.78,
            "size": 0.24,
            "motion": "none"
          }
        ]
      },
      {
        "id": "alarm",
        "start": 12,
        "end": 18,
        "layout": "story",
        "bg": "living_room",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.36,
            "size": 0.4,
            "pose": "scared",
            "expression": "shocked",
            "emote": "exclaim"
          }
        ],
        "title": "The alarm!",
        "props": [
          {
            "name": "gem",
            "x": 0.65,
            "y": 0.65,
            "size": 0.3,
            "motion": "none"
          }
        ],
        "actions": [
          {
            "at": 3,
            "who": "bob",
            "pose": "think",
            "expression": "worried"
          }
        ]
      },
      {
        "id": "dog",
        "start": 18,
        "end": 24,
        "layout": "story",
        "bg": "living_room",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.25,
            "size": 0.33,
            "pose": "scared",
            "expression": "scared"
          },
          {
            "who": "dog",
            "x": 0.7,
            "size": 0.5,
            "expression": "sleepy"
          }
        ],
        "title": "The worst hiding spot",
        "actions": [
          {
            "at": 2,
            "who": "dog",
            "expression": "excited",
            "pose": "celebrate"
          },
          {
            "at": 4,
            "who": "bob",
            "expression": "confused"
          }
        ]
      },
      {
        "id": "escape",
        "start": 24,
        "end": 30,
        "layout": "story",
        "bg": "city",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.3,
            "size": 0.36,
            "expression": "excited",
            "move": [
              {
                "at": 0,
                "duration": 3,
                "x": 0.5
              }
            ]
          },
          {
            "who": "dog",
            "x": 0.15,
            "size": 0.26,
            "expression": "happy",
            "holding": "moneybag",
            "move": [
              {
                "at": 0,
                "duration": 3,
                "x": 0.28
              }
            ]
          }
        ],
        "title": "Free at last?"
      },
      {
        "id": "twist",
        "start": 30,
        "end": 36,
        "layout": "story",
        "bg": "city",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "bob",
            "x": 0.24,
            "size": 0.31,
            "expression": "confused"
          },
          {
            "who": "officer",
            "x": 0.72,
            "size": 0.36,
            "pose": "point",
            "facing": "left"
          },
          {
            "who": "dog",
            "x": 0.48,
            "size": 0.24,
            "expression": "happy",
            "holding": "moneybag"
          }
        ],
        "title": "You stole… my dog!"
      },
      {
        "id": "school",
        "start": 36,
        "end": 42,
        "layout": "story",
        "bg": "schoolyard",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "girl",
            "x": 0.3,
            "size": 0.37,
            "pose": "wave",
            "expression": "happy"
          },
          {
            "who": "friend",
            "x": 0.7,
            "size": 0.34,
            "pose": "wave",
            "expression": "happy",
            "facing": "left"
          }
        ],
        "title": "Meeting a friend"
      },
      {
        "id": "farm",
        "start": 42,
        "end": 48,
        "layout": "story",
        "bg": "farm",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "farmer",
            "x": 0.32,
            "size": 0.42,
            "pose": "explain"
          },
          {
            "who": "cat",
            "x": 0.73,
            "size": 0.23,
            "expression": "happy"
          },
          {
            "who": "bird",
            "x": 0.58,
            "y": 0.52,
            "size": 0.14,
            "expression": "happy"
          }
        ],
        "title": "A morning on the farm"
      },
      {
        "id": "park",
        "start": 48,
        "end": 54,
        "layout": "story",
        "bg": "park",
        "speaker": "none",
        "camera": {
          "zoom": [
            1,
            1
          ]
        },
        "characters": [
          {
            "who": "girl",
            "x": 0.3,
            "size": 0.37,
            "expression": "happy"
          },
          {
            "who": "dog",
            "x": 0.7,
            "size": 0.31,
            "expression": "happy"
          }
        ],
        "title": "A walk in the park"
      }
    ],
    "captions": {
      "enabled": false
    }
  },
  "words": [],
  "mouth": [],
  "format": "shorts"
};
