export const themes = {
  "default": {
    "light": {
      "borderWidth": {
        "0": 0,
        "1": 1,
        "2": 2,
        "default": 1,
        "ring": 2
      },
      "breakpoint": {
        "2xl": 1536,
        "lg": 1024,
        "md": 768,
        "sm": 640,
        "xl": 1280
      },
      "color": {
        "accent": "#535cda",
        "accent-active": "#353b91",
        "accent-fg": "#464dbb",
        "accent-hover": "#464dbb",
        "accent-subtle": "#ecf3ff",
        "accent-100": "#ecf3ff",
        "accent-200": "#dce5ff",
        "accent-300": "#c4d1ff",
        "accent-400": "#9daeff",
        "accent-50": "#f5f9ff",
        "accent-500": "#7281ff",
        "accent-600": "#535cda",
        "accent-700": "#464dbb",
        "accent-800": "#353b91",
        "accent-900": "#272c6c",
        "accent-950": "#171a4c",
        "black": "#000000",
        "border": "#e6e7eb",
        "border-strong": "#90929a",
        "canvas": "#fafafb",
        "danger": "#c52b30",
        "danger-border": "#ffbeb7",
        "danger-fg": "#a92227",
        "danger-subtle": "#ffebe7",
        "danger-100": "#ffebe7",
        "danger-200": "#ffd9d4",
        "danger-300": "#ffbeb7",
        "danger-400": "#ff8a82",
        "danger-50": "#fff4f2",
        "danger-500": "#f4514f",
        "danger-600": "#c52b30",
        "danger-700": "#a92227",
        "danger-800": "#831a1d",
        "danger-900": "#621516",
        "danger-950": "#430709",
        "fg": "#212124",
        "fg-muted": "#5c5d64",
        "fg-subtle": "#90929a",
        "gray-100": "#f3f4f6",
        "gray-200": "#e6e7eb",
        "gray-300": "#d3d4da",
        "gray-400": "#b3b5bd",
        "gray-50": "#fafafb",
        "gray-500": "#90929a",
        "gray-600": "#6c6e75",
        "gray-700": "#5c5d64",
        "gray-800": "#46474c",
        "gray-900": "#343539",
        "gray-950": "#212124",
        "info": "#0076b8",
        "info-border": "#9bdeff",
        "info-fg": "#00649d",
        "info-subtle": "#def8ff",
        "info-100": "#def8ff",
        "info-200": "#c2eeff",
        "info-300": "#9bdeff",
        "info-400": "#59c0ff",
        "info-50": "#f0fcff",
        "info-500": "#069ce4",
        "info-600": "#0076b8",
        "info-700": "#00649d",
        "info-800": "#004d7a",
        "info-900": "#00395b",
        "info-950": "#00253e",
        "muted": "#e6e7eb",
        "on-accent": "#ffffff",
        "on-danger": "#ffffff",
        "on-info": "#ffffff",
        "on-success": "#ffffff",
        "on-warning": "#000000",
        "overlay": "#00000080",
        "ring": "#535cda",
        "subtle": "#f3f4f6",
        "success": "#008736",
        "success-border": "#9aebab",
        "success-fg": "#00732c",
        "success-subtle": "#e1fde5",
        "success-100": "#e1fde5",
        "success-200": "#c4f6cd",
        "success-300": "#9aebab",
        "success-400": "#63d180",
        "success-50": "#f1fef3",
        "success-500": "#24ae56",
        "success-600": "#008736",
        "success-700": "#00732c",
        "success-800": "#005821",
        "success-900": "#004219",
        "success-950": "#002b0b",
        "surface": "#ffffff",
        "surface-raised": "#ffffff",
        "warning": "#eea628",
        "warning-border": "#ffca78",
        "warning-fg": "#845100",
        "warning-subtle": "#fff1d5",
        "warning-100": "#fff1d5",
        "warning-200": "#ffe1af",
        "warning-300": "#ffca78",
        "warning-400": "#eea628",
        "warning-50": "#fff9eb",
        "warning-500": "#c98000",
        "warning-600": "#9b6000",
        "warning-700": "#845100",
        "warning-800": "#673d00",
        "warning-900": "#4f2c00",
        "warning-950": "#351b00",
        "white": "#ffffff"
      },
      "motion": {
        "duration": {
          "0": 0,
          "50": 50,
          "80": 80,
          "120": 120,
          "140": 140,
          "160": 160,
          "200": 200,
          "240": 240,
          "320": 320,
          "400": 400,
          "500": 500,
          "base-enter": 200,
          "base-exit": 140,
          "fast-enter": 120,
          "fast-exit": 80,
          "slow-enter": 320,
          "slow-exit": 240
        },
        "easing": {
          "enter": [
            0.05,
            0.7,
            0.1,
            1
          ],
          "exit": [
            0.3,
            0,
            0.8,
            0.15
          ],
          "linear": [
            0,
            0,
            1,
            1
          ],
          "standard": [
            0.2,
            0,
            0,
            1
          ]
        },
        "transition": {
          "emphasis": {
            "type": "spring",
            "config": {
              "stiffness": 400,
              "damping": 30,
              "mass": 1
            }
          },
          "enter": {
            "type": "timing",
            "duration": 200,
            "easing": [
              0.05,
              0.7,
              0.1,
              1
            ]
          },
          "exit": {
            "type": "timing",
            "duration": 140,
            "easing": [
              0.3,
              0,
              0.8,
              0.15
            ]
          }
        },
        "presets": {
          "fade": {
            "enter": {
              "from": {
                "opacity": 0
              },
              "to": {
                "opacity": 1
              },
              "transition": {
                "type": "timing",
                "duration": 200,
                "easing": [
                  0.05,
                  0.7,
                  0.1,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "opacity": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 140,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "pop": {
            "enter": {
              "from": {
                "scale": 0.9
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 15,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "scale": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "press": {
            "enter": {
              "from": {
                "scale": 1
              },
              "to": {
                "scale": 0.97
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.2,
                  0,
                  0,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "scale": 0.97
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "reduced": null
          },
          "scale-in": {
            "enter": {
              "from": {
                "opacity": 0,
                "scale": 0.96
              },
              "to": {
                "opacity": 1,
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "scale": 1
              },
              "to": {
                "opacity": 0,
                "scale": 0.98
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "sheet": {
            "enter": {
              "from": {
                "translateY": "100%"
              },
              "to": {
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 35,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "translateY": 0
              },
              "to": {
                "translateY": "100%"
              },
              "transition": {
                "type": "timing",
                "duration": 240,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "slide-up": {
            "enter": {
              "from": {
                "opacity": 0,
                "translateY": 8
              },
              "to": {
                "opacity": 1,
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "translateY": 0
              },
              "to": {
                "opacity": 0,
                "translateY": 4
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          }
        },
        "spring": {
          "bouncy": {
            "stiffness": 300,
            "damping": 15,
            "mass": 1
          },
          "smooth": {
            "stiffness": 300,
            "damping": 35,
            "mass": 1
          },
          "snappy": {
            "stiffness": 400,
            "damping": 30,
            "mass": 1
          }
        }
      },
      "elevation": {
        "overlay": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "popover": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "raised": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
      },
      "fontFamily": {
        "mono": "JetBrainsMono_400Regular",
        "sans": "Inter_400Regular"
      },
      "fontWeight": {
        "bold": 700,
        "medium": 500,
        "regular": 400,
        "semibold": 600
      },
      "opacity": {
        "50": 0.5,
        "disabled": 0.5
      },
      "radius": {
        "2xl": 16,
        "card": 8,
        "control": 6,
        "full": 9999,
        "lg": 8,
        "md": 6,
        "none": 0,
        "overlay": 12,
        "pill": 9999,
        "sm": 4,
        "xl": 12,
        "xs": 2
      },
      "ringOffset": {
        "2": 2,
        "default": 2
      },
      "shadow": {
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "sm": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "xs": "0 1px 2px rgb(0 0 0 / 0.05)"
      },
      "size": {
        "control-lg": 48,
        "control-md": 40,
        "control-sm": 32,
        "demo-box": 96,
        "icon-lg": 24,
        "icon-md": 20,
        "icon-sm": 16,
        "touch-target": 44
      },
      "space": {
        "0": 0,
        "1": 4,
        "2": 8,
        "3": 12,
        "4": 16,
        "5": 20,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80,
        "24": 96,
        "0-5": 2,
        "1-5": 6
      },
      "text": {
        "body": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        },
        "body-lg": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 18,
          "lineHeight": 28,
          "letterSpacing": -0.2
        },
        "body-sm": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 14,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "caption": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 12,
          "lineHeight": 16,
          "letterSpacing": 0
        },
        "code": {
          "fontFamily": "JetBrainsMono_400Regular",
          "fontSize": 13,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "display": {
          "fontFamily": "Inter_700Bold",
          "fontSize": 36,
          "lineHeight": 40,
          "letterSpacing": -0.72
        },
        "label": {
          "fontFamily": "Inter_500Medium",
          "fontSize": 13,
          "lineHeight": 18,
          "letterSpacing": 0
        },
        "max-scale": 1.5,
        "title": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 20,
          "lineHeight": 28,
          "letterSpacing": -0.22
        },
        "title-lg": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 24,
          "lineHeight": 32,
          "letterSpacing": -0.48
        },
        "title-sm": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        }
      },
      "zIndex": {
        "base": 0,
        "dropdown": 1000,
        "modal": 1400,
        "overlay": 1300,
        "popover": 1500,
        "raised": 10,
        "sticky": 1100,
        "toast": 1700,
        "tooltip": 1800
      }
    },
    "dark": {
      "borderWidth": {
        "0": 0,
        "1": 1,
        "2": 2,
        "default": 1,
        "ring": 2
      },
      "breakpoint": {
        "2xl": 1536,
        "lg": 1024,
        "md": 768,
        "sm": 640,
        "xl": 1280
      },
      "color": {
        "accent": "#545ed5",
        "accent-active": "#242671",
        "accent-fg": "#d0dbff",
        "accent-hover": "#33369c",
        "accent-subtle": "#1a1e4a",
        "accent-100": "#12162d",
        "accent-200": "#1a1e4a",
        "accent-300": "#242671",
        "accent-400": "#33369c",
        "accent-50": "#0d0f19",
        "accent-500": "#545ed5",
        "accent-600": "#6572e4",
        "accent-700": "#8494fc",
        "accent-800": "#a7b7ff",
        "accent-900": "#d0dbff",
        "accent-950": "#eaf0ff",
        "black": "#000000",
        "border": "#323337",
        "border-strong": "#6d6e75",
        "canvas": "#0f0f10",
        "danger": "#c13234",
        "danger-border": "#8a0013",
        "danger-fg": "#ffccc5",
        "danger-subtle": "#430f0e",
        "danger-100": "#2a0f0d",
        "danger-200": "#430f0e",
        "danger-300": "#64040c",
        "danger-400": "#8a0013",
        "danger-50": "#180c0b",
        "danger-500": "#c13234",
        "danger-600": "#d34c49",
        "danger-700": "#ee746d",
        "danger-800": "#ff9c94",
        "danger-900": "#ffccc5",
        "danger-950": "#ffe8e4",
        "fg": "#f1f2f5",
        "fg-muted": "#9c9ea4",
        "fg-subtle": "#7e8086",
        "gray-100": "#18181a",
        "gray-200": "#232426",
        "gray-300": "#323337",
        "gray-400": "#46474d",
        "gray-50": "#0f0f10",
        "gray-500": "#6d6e75",
        "gray-600": "#7e8086",
        "gray-700": "#9c9ea4",
        "gray-800": "#bcbdc3",
        "gray-900": "#dddee2",
        "gray-950": "#f1f2f5",
        "info": "#0076b4",
        "info-border": "#004d80",
        "info-fg": "#b2e5ff",
        "info-subtle": "#00273e",
        "info-100": "#081a26",
        "info-200": "#00273e",
        "info-300": "#00375d",
        "info-400": "#004d80",
        "info-50": "#091016",
        "info-500": "#0076b4",
        "info-600": "#1d89c4",
        "info-700": "#54a7de",
        "info-800": "#84c6f5",
        "info-900": "#b2e5ff",
        "info-950": "#d8f7ff",
        "muted": "#323337",
        "on-accent": "#ffffff",
        "on-danger": "#ffffff",
        "on-info": "#ffffff",
        "on-success": "#ffffff",
        "on-warning": "#000000",
        "overlay": "#00000099",
        "ring": "#6572e4",
        "subtle": "#232426",
        "success": "#00863a",
        "success-border": "#005a18",
        "success-fg": "#b7eec1",
        "success-subtle": "#022d10",
        "success-100": "#0a1d0f",
        "success-200": "#022d10",
        "success-300": "#004110",
        "success-400": "#005a18",
        "success-50": "#0a120b",
        "success-500": "#00863a",
        "success-600": "#2b974e",
        "success-700": "#5cb572",
        "success-800": "#8ad199",
        "success-900": "#b7eec1",
        "success-950": "#d2ffda",
        "surface": "#18181a",
        "surface-raised": "#232426",
        "warning": "#cd9130",
        "warning-border": "#673d00",
        "warning-fg": "#ffd79f",
        "warning-subtle": "#371e00",
        "warning-100": "#221503",
        "warning-200": "#371e00",
        "warning-300": "#4c2a00",
        "warning-400": "#673d00",
        "warning-50": "#140e07",
        "warning-500": "#9b6000",
        "warning-600": "#b17000",
        "warning-700": "#cd9130",
        "warning-800": "#e6b46c",
        "warning-900": "#ffd79f",
        "warning-950": "#ffecc0",
        "white": "#ffffff"
      },
      "motion": {
        "duration": {
          "0": 0,
          "50": 50,
          "80": 80,
          "120": 120,
          "140": 140,
          "160": 160,
          "200": 200,
          "240": 240,
          "320": 320,
          "400": 400,
          "500": 500,
          "base-enter": 200,
          "base-exit": 140,
          "fast-enter": 120,
          "fast-exit": 80,
          "slow-enter": 320,
          "slow-exit": 240
        },
        "easing": {
          "enter": [
            0.05,
            0.7,
            0.1,
            1
          ],
          "exit": [
            0.3,
            0,
            0.8,
            0.15
          ],
          "linear": [
            0,
            0,
            1,
            1
          ],
          "standard": [
            0.2,
            0,
            0,
            1
          ]
        },
        "transition": {
          "emphasis": {
            "type": "spring",
            "config": {
              "stiffness": 400,
              "damping": 30,
              "mass": 1
            }
          },
          "enter": {
            "type": "timing",
            "duration": 200,
            "easing": [
              0.05,
              0.7,
              0.1,
              1
            ]
          },
          "exit": {
            "type": "timing",
            "duration": 140,
            "easing": [
              0.3,
              0,
              0.8,
              0.15
            ]
          }
        },
        "presets": {
          "fade": {
            "enter": {
              "from": {
                "opacity": 0
              },
              "to": {
                "opacity": 1
              },
              "transition": {
                "type": "timing",
                "duration": 200,
                "easing": [
                  0.05,
                  0.7,
                  0.1,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "opacity": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 140,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "pop": {
            "enter": {
              "from": {
                "scale": 0.9
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 15,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "scale": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "press": {
            "enter": {
              "from": {
                "scale": 1
              },
              "to": {
                "scale": 0.97
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.2,
                  0,
                  0,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "scale": 0.97
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "reduced": null
          },
          "scale-in": {
            "enter": {
              "from": {
                "opacity": 0,
                "scale": 0.96
              },
              "to": {
                "opacity": 1,
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "scale": 1
              },
              "to": {
                "opacity": 0,
                "scale": 0.98
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "sheet": {
            "enter": {
              "from": {
                "translateY": "100%"
              },
              "to": {
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 35,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "translateY": 0
              },
              "to": {
                "translateY": "100%"
              },
              "transition": {
                "type": "timing",
                "duration": 240,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "slide-up": {
            "enter": {
              "from": {
                "opacity": 0,
                "translateY": 8
              },
              "to": {
                "opacity": 1,
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "translateY": 0
              },
              "to": {
                "opacity": 0,
                "translateY": 4
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          }
        },
        "spring": {
          "bouncy": {
            "stiffness": 300,
            "damping": 15,
            "mass": 1
          },
          "smooth": {
            "stiffness": 300,
            "damping": 35,
            "mass": 1
          },
          "snappy": {
            "stiffness": 400,
            "damping": 30,
            "mass": 1
          }
        }
      },
      "elevation": {
        "overlay": "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
        "popover": "0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.25)",
        "raised": "0 1px 3px rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)"
      },
      "fontFamily": {
        "mono": "JetBrainsMono_400Regular",
        "sans": "Inter_400Regular"
      },
      "fontWeight": {
        "bold": 700,
        "medium": 500,
        "regular": 400,
        "semibold": 600
      },
      "opacity": {
        "50": 0.5,
        "disabled": 0.5
      },
      "radius": {
        "2xl": 16,
        "card": 8,
        "control": 6,
        "full": 9999,
        "lg": 8,
        "md": 6,
        "none": 0,
        "overlay": 12,
        "pill": 9999,
        "sm": 4,
        "xl": 12,
        "xs": 2
      },
      "ringOffset": {
        "2": 2,
        "default": 2
      },
      "shadow": {
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.25)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.25)",
        "sm": "0 1px 3px rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
        "xs": "0 1px 2px rgb(0 0 0 / 0.13)"
      },
      "size": {
        "control-lg": 48,
        "control-md": 40,
        "control-sm": 32,
        "demo-box": 96,
        "icon-lg": 24,
        "icon-md": 20,
        "icon-sm": 16,
        "touch-target": 44
      },
      "space": {
        "0": 0,
        "1": 4,
        "2": 8,
        "3": 12,
        "4": 16,
        "5": 20,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80,
        "24": 96,
        "0-5": 2,
        "1-5": 6
      },
      "text": {
        "body": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        },
        "body-lg": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 18,
          "lineHeight": 28,
          "letterSpacing": -0.2
        },
        "body-sm": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 14,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "caption": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 12,
          "lineHeight": 16,
          "letterSpacing": 0
        },
        "code": {
          "fontFamily": "JetBrainsMono_400Regular",
          "fontSize": 13,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "display": {
          "fontFamily": "Inter_700Bold",
          "fontSize": 36,
          "lineHeight": 40,
          "letterSpacing": -0.72
        },
        "label": {
          "fontFamily": "Inter_500Medium",
          "fontSize": 13,
          "lineHeight": 18,
          "letterSpacing": 0
        },
        "max-scale": 1.5,
        "title": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 20,
          "lineHeight": 28,
          "letterSpacing": -0.22
        },
        "title-lg": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 24,
          "lineHeight": 32,
          "letterSpacing": -0.48
        },
        "title-sm": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        }
      },
      "zIndex": {
        "base": 0,
        "dropdown": 1000,
        "modal": 1400,
        "overlay": 1300,
        "popover": 1500,
        "raised": 10,
        "sticky": 1100,
        "toast": 1700,
        "tooltip": 1800
      }
    }
  },
  "brand": {
    "light": {
      "borderWidth": {
        "0": 0,
        "1": 1,
        "2": 2,
        "default": 1,
        "ring": 2
      },
      "breakpoint": {
        "2xl": 1536,
        "lg": 1024,
        "md": 768,
        "sm": 640,
        "xl": 1280
      },
      "color": {
        "accent": "#e11d48",
        "accent-active": "#880726",
        "accent-fg": "#af0833",
        "accent-hover": "#af0833",
        "accent-subtle": "#ffeaeb",
        "accent-100": "#ffeaeb",
        "accent-200": "#ffd8d9",
        "accent-300": "#ffbdbf",
        "accent-400": "#ff8890",
        "accent-50": "#fff3f3",
        "accent-500": "#fc405d",
        "accent-600": "#e11d48",
        "accent-700": "#af0833",
        "accent-800": "#880726",
        "accent-900": "#660a1d",
        "accent-950": "#46000f",
        "black": "#000000",
        "border": "#ebe6e6",
        "border-strong": "#998f8f",
        "canvas": "#fbfafa",
        "danger": "#c52b30",
        "danger-border": "#ffbeb7",
        "danger-fg": "#a92227",
        "danger-subtle": "#ffebe7",
        "danger-100": "#ffebe7",
        "danger-200": "#ffd9d4",
        "danger-300": "#ffbeb7",
        "danger-400": "#ff8a82",
        "danger-50": "#fff4f2",
        "danger-500": "#f4514f",
        "danger-600": "#c52b30",
        "danger-700": "#a92227",
        "danger-800": "#831a1d",
        "danger-900": "#621516",
        "danger-950": "#430709",
        "fg": "#242121",
        "fg-muted": "#635b5b",
        "fg-subtle": "#998f8f",
        "gray-100": "#f6f3f3",
        "gray-200": "#ebe6e6",
        "gray-300": "#dad3d3",
        "gray-400": "#bdb3b3",
        "gray-50": "#fbfafa",
        "gray-500": "#998f8f",
        "gray-600": "#756c6c",
        "gray-700": "#635b5b",
        "gray-800": "#4c4646",
        "gray-900": "#393434",
        "gray-950": "#242121",
        "info": "#0076b8",
        "info-border": "#9bdeff",
        "info-fg": "#00649d",
        "info-subtle": "#def8ff",
        "info-100": "#def8ff",
        "info-200": "#c2eeff",
        "info-300": "#9bdeff",
        "info-400": "#59c0ff",
        "info-50": "#f0fcff",
        "info-500": "#069ce4",
        "info-600": "#0076b8",
        "info-700": "#00649d",
        "info-800": "#004d7a",
        "info-900": "#00395b",
        "info-950": "#00253e",
        "muted": "#ebe6e6",
        "on-accent": "#ffffff",
        "on-danger": "#ffffff",
        "on-info": "#ffffff",
        "on-success": "#ffffff",
        "on-warning": "#000000",
        "overlay": "#00000080",
        "ring": "#e11d48",
        "subtle": "#f6f3f3",
        "success": "#008736",
        "success-border": "#9aebab",
        "success-fg": "#00732c",
        "success-subtle": "#e1fde5",
        "success-100": "#e1fde5",
        "success-200": "#c4f6cd",
        "success-300": "#9aebab",
        "success-400": "#63d180",
        "success-50": "#f1fef3",
        "success-500": "#24ae56",
        "success-600": "#008736",
        "success-700": "#00732c",
        "success-800": "#005821",
        "success-900": "#004219",
        "success-950": "#002b0b",
        "surface": "#ffffff",
        "surface-raised": "#ffffff",
        "warning": "#eea628",
        "warning-border": "#ffca78",
        "warning-fg": "#845100",
        "warning-subtle": "#fff1d5",
        "warning-100": "#fff1d5",
        "warning-200": "#ffe1af",
        "warning-300": "#ffca78",
        "warning-400": "#eea628",
        "warning-50": "#fff9eb",
        "warning-500": "#c98000",
        "warning-600": "#9b6000",
        "warning-700": "#845100",
        "warning-800": "#673d00",
        "warning-900": "#4f2c00",
        "warning-950": "#351b00",
        "white": "#ffffff"
      },
      "motion": {
        "duration": {
          "0": 0,
          "50": 50,
          "80": 80,
          "120": 120,
          "140": 140,
          "160": 160,
          "200": 200,
          "240": 240,
          "320": 320,
          "400": 400,
          "500": 500,
          "base-enter": 200,
          "base-exit": 140,
          "fast-enter": 120,
          "fast-exit": 80,
          "slow-enter": 320,
          "slow-exit": 240
        },
        "easing": {
          "enter": [
            0.05,
            0.7,
            0.1,
            1
          ],
          "exit": [
            0.3,
            0,
            0.8,
            0.15
          ],
          "linear": [
            0,
            0,
            1,
            1
          ],
          "standard": [
            0.2,
            0,
            0,
            1
          ]
        },
        "transition": {
          "emphasis": {
            "type": "spring",
            "config": {
              "stiffness": 400,
              "damping": 30,
              "mass": 1
            }
          },
          "enter": {
            "type": "timing",
            "duration": 200,
            "easing": [
              0.05,
              0.7,
              0.1,
              1
            ]
          },
          "exit": {
            "type": "timing",
            "duration": 140,
            "easing": [
              0.3,
              0,
              0.8,
              0.15
            ]
          }
        },
        "presets": {
          "fade": {
            "enter": {
              "from": {
                "opacity": 0
              },
              "to": {
                "opacity": 1
              },
              "transition": {
                "type": "timing",
                "duration": 200,
                "easing": [
                  0.05,
                  0.7,
                  0.1,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "opacity": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 140,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "pop": {
            "enter": {
              "from": {
                "scale": 0.9
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 15,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "scale": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "press": {
            "enter": {
              "from": {
                "scale": 1
              },
              "to": {
                "scale": 0.97
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.2,
                  0,
                  0,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "scale": 0.97
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "reduced": null
          },
          "scale-in": {
            "enter": {
              "from": {
                "opacity": 0,
                "scale": 0.96
              },
              "to": {
                "opacity": 1,
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "scale": 1
              },
              "to": {
                "opacity": 0,
                "scale": 0.98
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "sheet": {
            "enter": {
              "from": {
                "translateY": "100%"
              },
              "to": {
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 35,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "translateY": 0
              },
              "to": {
                "translateY": "100%"
              },
              "transition": {
                "type": "timing",
                "duration": 240,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "slide-up": {
            "enter": {
              "from": {
                "opacity": 0,
                "translateY": 8
              },
              "to": {
                "opacity": 1,
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "translateY": 0
              },
              "to": {
                "opacity": 0,
                "translateY": 4
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          }
        },
        "spring": {
          "bouncy": {
            "stiffness": 300,
            "damping": 15,
            "mass": 1
          },
          "smooth": {
            "stiffness": 300,
            "damping": 35,
            "mass": 1
          },
          "snappy": {
            "stiffness": 400,
            "damping": 30,
            "mass": 1
          }
        }
      },
      "elevation": {
        "overlay": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "popover": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "raised": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
      },
      "fontFamily": {
        "mono": "JetBrainsMono_400Regular",
        "sans": "Inter_400Regular"
      },
      "fontWeight": {
        "bold": 700,
        "medium": 500,
        "regular": 400,
        "semibold": 600
      },
      "opacity": {
        "50": 0.5,
        "disabled": 0.5
      },
      "radius": {
        "2xl": 16,
        "card": 12,
        "control": 8,
        "full": 9999,
        "lg": 8,
        "md": 6,
        "none": 0,
        "overlay": 16,
        "pill": 9999,
        "sm": 4,
        "xl": 12,
        "xs": 2
      },
      "ringOffset": {
        "2": 2,
        "default": 2
      },
      "shadow": {
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "sm": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "xs": "0 1px 2px rgb(0 0 0 / 0.05)"
      },
      "size": {
        "control-lg": 48,
        "control-md": 40,
        "control-sm": 32,
        "demo-box": 96,
        "icon-lg": 24,
        "icon-md": 20,
        "icon-sm": 16,
        "touch-target": 44
      },
      "space": {
        "0": 0,
        "1": 4,
        "2": 8,
        "3": 12,
        "4": 16,
        "5": 20,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80,
        "24": 96,
        "0-5": 2,
        "1-5": 6
      },
      "text": {
        "body": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        },
        "body-lg": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 18,
          "lineHeight": 28,
          "letterSpacing": -0.2
        },
        "body-sm": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 14,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "caption": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 12,
          "lineHeight": 16,
          "letterSpacing": 0
        },
        "code": {
          "fontFamily": "JetBrainsMono_400Regular",
          "fontSize": 13,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "display": {
          "fontFamily": "Inter_700Bold",
          "fontSize": 36,
          "lineHeight": 40,
          "letterSpacing": -0.72
        },
        "label": {
          "fontFamily": "Inter_500Medium",
          "fontSize": 13,
          "lineHeight": 18,
          "letterSpacing": 0
        },
        "max-scale": 1.5,
        "title": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 20,
          "lineHeight": 28,
          "letterSpacing": -0.22
        },
        "title-lg": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 24,
          "lineHeight": 32,
          "letterSpacing": -0.48
        },
        "title-sm": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        }
      },
      "zIndex": {
        "base": 0,
        "dropdown": 1000,
        "modal": 1400,
        "overlay": 1300,
        "popover": 1500,
        "raised": 10,
        "sticky": 1100,
        "toast": 1700,
        "tooltip": 1800
      }
    },
    "dark": {
      "borderWidth": {
        "0": 0,
        "1": 1,
        "2": 2,
        "default": 1,
        "ring": 2
      },
      "breakpoint": {
        "2xl": 1536,
        "lg": 1024,
        "md": 768,
        "sm": 640,
        "xl": 1280
      },
      "color": {
        "accent": "#c81f41",
        "accent-active": "#680016",
        "accent-fg": "#ffcbcc",
        "accent-hover": "#8f0020",
        "accent-subtle": "#460913",
        "accent-100": "#2b0d10",
        "accent-200": "#460913",
        "accent-300": "#680016",
        "accent-400": "#8f0020",
        "accent-50": "#190b0b",
        "accent-500": "#c81f41",
        "accent-600": "#e11d48",
        "accent-700": "#f56b76",
        "accent-800": "#ff979c",
        "accent-900": "#ffcbcc",
        "accent-950": "#ffe7e7",
        "black": "#000000",
        "border": "#373131",
        "border-strong": "#756c6c",
        "canvas": "#100f0f",
        "danger": "#c13234",
        "danger-border": "#8a0013",
        "danger-fg": "#ffccc5",
        "danger-subtle": "#430f0e",
        "danger-100": "#2a0f0d",
        "danger-200": "#430f0e",
        "danger-300": "#64040c",
        "danger-400": "#8a0013",
        "danger-50": "#180c0b",
        "danger-500": "#c13234",
        "danger-600": "#d34c49",
        "danger-700": "#ee746d",
        "danger-800": "#ff9c94",
        "danger-900": "#ffccc5",
        "danger-950": "#ffe8e4",
        "fg": "#f5f0f0",
        "fg-muted": "#a49c9c",
        "fg-subtle": "#867e7e",
        "gray-100": "#191818",
        "gray-200": "#262323",
        "gray-300": "#373131",
        "gray-400": "#4d4646",
        "gray-50": "#100f0f",
        "gray-500": "#756c6c",
        "gray-600": "#867e7e",
        "gray-700": "#a49c9c",
        "gray-800": "#c2bcbc",
        "gray-900": "#e2dcdc",
        "gray-950": "#f5f0f0",
        "info": "#0076b4",
        "info-border": "#004d80",
        "info-fg": "#b2e5ff",
        "info-subtle": "#00273e",
        "info-100": "#081a26",
        "info-200": "#00273e",
        "info-300": "#00375d",
        "info-400": "#004d80",
        "info-50": "#091016",
        "info-500": "#0076b4",
        "info-600": "#1d89c4",
        "info-700": "#54a7de",
        "info-800": "#84c6f5",
        "info-900": "#b2e5ff",
        "info-950": "#d8f7ff",
        "muted": "#373131",
        "on-accent": "#ffffff",
        "on-danger": "#ffffff",
        "on-info": "#ffffff",
        "on-success": "#ffffff",
        "on-warning": "#000000",
        "overlay": "#00000099",
        "ring": "#e11d48",
        "subtle": "#262323",
        "success": "#00863a",
        "success-border": "#005a18",
        "success-fg": "#b7eec1",
        "success-subtle": "#022d10",
        "success-100": "#0a1d0f",
        "success-200": "#022d10",
        "success-300": "#004110",
        "success-400": "#005a18",
        "success-50": "#0a120b",
        "success-500": "#00863a",
        "success-600": "#2b974e",
        "success-700": "#5cb572",
        "success-800": "#8ad199",
        "success-900": "#b7eec1",
        "success-950": "#d2ffda",
        "surface": "#191818",
        "surface-raised": "#262323",
        "warning": "#cd9130",
        "warning-border": "#673d00",
        "warning-fg": "#ffd79f",
        "warning-subtle": "#371e00",
        "warning-100": "#221503",
        "warning-200": "#371e00",
        "warning-300": "#4c2a00",
        "warning-400": "#673d00",
        "warning-50": "#140e07",
        "warning-500": "#9b6000",
        "warning-600": "#b17000",
        "warning-700": "#cd9130",
        "warning-800": "#e6b46c",
        "warning-900": "#ffd79f",
        "warning-950": "#ffecc0",
        "white": "#ffffff"
      },
      "motion": {
        "duration": {
          "0": 0,
          "50": 50,
          "80": 80,
          "120": 120,
          "140": 140,
          "160": 160,
          "200": 200,
          "240": 240,
          "320": 320,
          "400": 400,
          "500": 500,
          "base-enter": 200,
          "base-exit": 140,
          "fast-enter": 120,
          "fast-exit": 80,
          "slow-enter": 320,
          "slow-exit": 240
        },
        "easing": {
          "enter": [
            0.05,
            0.7,
            0.1,
            1
          ],
          "exit": [
            0.3,
            0,
            0.8,
            0.15
          ],
          "linear": [
            0,
            0,
            1,
            1
          ],
          "standard": [
            0.2,
            0,
            0,
            1
          ]
        },
        "transition": {
          "emphasis": {
            "type": "spring",
            "config": {
              "stiffness": 400,
              "damping": 30,
              "mass": 1
            }
          },
          "enter": {
            "type": "timing",
            "duration": 200,
            "easing": [
              0.05,
              0.7,
              0.1,
              1
            ]
          },
          "exit": {
            "type": "timing",
            "duration": 140,
            "easing": [
              0.3,
              0,
              0.8,
              0.15
            ]
          }
        },
        "presets": {
          "fade": {
            "enter": {
              "from": {
                "opacity": 0
              },
              "to": {
                "opacity": 1
              },
              "transition": {
                "type": "timing",
                "duration": 200,
                "easing": [
                  0.05,
                  0.7,
                  0.1,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "opacity": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 140,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "pop": {
            "enter": {
              "from": {
                "scale": 0.9
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 15,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "scale": 1
              },
              "to": {
                "opacity": 0
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "press": {
            "enter": {
              "from": {
                "scale": 1
              },
              "to": {
                "scale": 0.97
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.2,
                  0,
                  0,
                  1
                ]
              }
            },
            "exit": {
              "from": {
                "scale": 0.97
              },
              "to": {
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "reduced": null
          },
          "scale-in": {
            "enter": {
              "from": {
                "opacity": 0,
                "scale": 0.96
              },
              "to": {
                "opacity": 1,
                "scale": 1
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "scale": 1
              },
              "to": {
                "opacity": 0,
                "scale": 0.98
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "sheet": {
            "enter": {
              "from": {
                "translateY": "100%"
              },
              "to": {
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 300,
                  "damping": 35,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "translateY": 0
              },
              "to": {
                "translateY": "100%"
              },
              "transition": {
                "type": "timing",
                "duration": 240,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          },
          "slide-up": {
            "enter": {
              "from": {
                "opacity": 0,
                "translateY": 8
              },
              "to": {
                "opacity": 1,
                "translateY": 0
              },
              "transition": {
                "type": "spring",
                "config": {
                  "stiffness": 400,
                  "damping": 30,
                  "mass": 1
                }
              }
            },
            "exit": {
              "from": {
                "opacity": 1,
                "translateY": 0
              },
              "to": {
                "opacity": 0,
                "translateY": 4
              },
              "transition": {
                "type": "timing",
                "duration": 80,
                "easing": [
                  0.3,
                  0,
                  0.8,
                  0.15
                ]
              }
            },
            "reduced": {
              "enter": {
                "from": {
                  "opacity": 0
                },
                "to": {
                  "opacity": 1
                },
                "transition": {
                  "type": "timing",
                  "duration": 120,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              },
              "exit": {
                "from": {
                  "opacity": 1
                },
                "to": {
                  "opacity": 0
                },
                "transition": {
                  "type": "timing",
                  "duration": 80,
                  "easing": [
                    0,
                    0,
                    1,
                    1
                  ]
                }
              }
            }
          }
        },
        "spring": {
          "bouncy": {
            "stiffness": 300,
            "damping": 15,
            "mass": 1
          },
          "smooth": {
            "stiffness": 300,
            "damping": 35,
            "mass": 1
          },
          "snappy": {
            "stiffness": 400,
            "damping": 30,
            "mass": 1
          }
        }
      },
      "elevation": {
        "overlay": "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
        "popover": "0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.25)",
        "raised": "0 1px 3px rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)"
      },
      "fontFamily": {
        "mono": "JetBrainsMono_400Regular",
        "sans": "Inter_400Regular"
      },
      "fontWeight": {
        "bold": 700,
        "medium": 500,
        "regular": 400,
        "semibold": 600
      },
      "opacity": {
        "50": 0.5,
        "disabled": 0.5
      },
      "radius": {
        "2xl": 16,
        "card": 12,
        "control": 8,
        "full": 9999,
        "lg": 8,
        "md": 6,
        "none": 0,
        "overlay": 16,
        "pill": 9999,
        "sm": 4,
        "xl": 12,
        "xs": 2
      },
      "ringOffset": {
        "2": 2,
        "default": 2
      },
      "shadow": {
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.25)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.25)",
        "sm": "0 1px 3px rgb(0 0 0 / 0.25), 0 1px 2px -1px rgb(0 0 0 / 0.25)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
        "xs": "0 1px 2px rgb(0 0 0 / 0.13)"
      },
      "size": {
        "control-lg": 48,
        "control-md": 40,
        "control-sm": 32,
        "demo-box": 96,
        "icon-lg": 24,
        "icon-md": 20,
        "icon-sm": 16,
        "touch-target": 44
      },
      "space": {
        "0": 0,
        "1": 4,
        "2": 8,
        "3": 12,
        "4": 16,
        "5": 20,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80,
        "24": 96,
        "0-5": 2,
        "1-5": 6
      },
      "text": {
        "body": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        },
        "body-lg": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 18,
          "lineHeight": 28,
          "letterSpacing": -0.2
        },
        "body-sm": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 14,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "caption": {
          "fontFamily": "Inter_400Regular",
          "fontSize": 12,
          "lineHeight": 16,
          "letterSpacing": 0
        },
        "code": {
          "fontFamily": "JetBrainsMono_400Regular",
          "fontSize": 13,
          "lineHeight": 20,
          "letterSpacing": 0
        },
        "display": {
          "fontFamily": "Inter_700Bold",
          "fontSize": 36,
          "lineHeight": 40,
          "letterSpacing": -0.72
        },
        "label": {
          "fontFamily": "Inter_500Medium",
          "fontSize": 13,
          "lineHeight": 18,
          "letterSpacing": 0
        },
        "max-scale": 1.5,
        "title": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 20,
          "lineHeight": 28,
          "letterSpacing": -0.22
        },
        "title-lg": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 24,
          "lineHeight": 32,
          "letterSpacing": -0.48
        },
        "title-sm": {
          "fontFamily": "Inter_600SemiBold",
          "fontSize": 16,
          "lineHeight": 24,
          "letterSpacing": -0.18
        }
      },
      "zIndex": {
        "base": 0,
        "dropdown": 1000,
        "modal": 1400,
        "overlay": 1300,
        "popover": 1500,
        "raised": 10,
        "sticky": 1100,
        "toast": 1700,
        "tooltip": 1800
      }
    }
  }
};
