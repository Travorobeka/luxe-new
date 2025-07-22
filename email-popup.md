{% doc %}
  @prompt
    Create CSS animation code to make an announcement bar text scroll continuously from right to left across the screen. The animation should be smooth, loop infinitely, and work well for promotional messages or announcements., spread out the text. maybe create 3 more announcent text section so that i can add text in differnt ones instead of putting all of it into 1 text box. or find a differrnt and effienct way, the text is still conjested together maybe put a tiny delay on each text and make the announcment bar seem never ending but its just displaying the same text in a never enedin gloop, put the separator at the start and add any cool customisations

{% enddoc %}
{% assign ai_gen_id = block.id | replace: '_', '' | downcase %}

{% style %}
  .ai-announcement-bar-{{ ai_gen_id }} {
    position: relative;
    width: 100%;
    height: {{ block.settings.bar_height }}px;
    background: {{ block.settings.background_color }};
    {% if block.settings.background_gradient != blank %}
      background: {{ block.settings.background_gradient }};
    {% endif %}
    color: {{ block.settings.text_color }};
    overflow: hidden;
    display: flex;
    align-items: center;
    {% if block.settings.border_top_enabled %}
      border-top: {{ block.settings.border_width }}px solid {{ block.settings.border_color }};
    {% endif %}
    {% if block.settings.border_bottom_enabled %}
      border-bottom: {{ block.settings.border_width }}px solid {{ block.settings.border_color }};
    {% endif %}
    {% if block.settings.text_shadow %}
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    {% endif %}
  }

  .ai-announcement-track-{{ ai_gen_id }} {
    display: flex;
    white-space: nowrap;
    will-change: transform;
    animation: ai-announcement-scroll-{{ ai_gen_id }} {{ block.settings.scroll_speed }}s linear infinite;
    {% if block.settings.scroll_direction == 'left' %}
      animation-direction: normal;
    {% else %}
      animation-direction: reverse;
    {% endif %}
  }

  .ai-announcement-item-{{ ai_gen_id }} {
    display: inline-flex;
    align-items: center;
    padding: 0 {{ block.settings.item_spacing }}px;
    font-size: {{ block.settings.text_size }}px;
    font-weight: {{ block.settings.text_weight }};
    letter-spacing: {{ block.settings.letter_spacing }}px;
    {% if block.settings.uppercase_text %}
      text-transform: uppercase;
    {% endif %}
    {% if block.settings.glow_effect %}
      filter: drop-shadow(0 0 8px {{ block.settings.glow_color }});
    {% endif %}
  }

  .ai-announcement-separator-{{ ai_gen_id }} {
    margin: 0 {{ block.settings.separator_spacing }}px;
    opacity: {{ block.settings.separator_opacity | divided_by: 100.0 }};
    font-size: {{ block.settings.separator_size }}px;
    {% if block.settings.separator_style == 'pulse' %}
      animation: ai-announcement-pulse-{{ ai_gen_id }} 2s ease-in-out infinite;
    {% elsif block.settings.separator_style == 'rotate' %}
      animation: ai-announcement-rotate-{{ ai_gen_id }} 3s linear infinite;
    {% elsif block.settings.separator_style == 'bounce' %}
      animation: ai-announcement-bounce-{{ ai_gen_id }} 1.5s ease-in-out infinite;
    {% endif %}
    {% if block.settings.separator_color != blank %}
      color: {{ block.settings.separator_color }};
    {% endif %}
  }

  {% if block.settings.rainbow_text %}
    .ai-announcement-item-{{ ai_gen_id }} {
      background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
      background-size: 400% 400%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: ai-announcement-rainbow-{{ ai_gen_id }} 3s ease infinite;
    }
  {% endif %}

  @keyframes ai-announcement-scroll-{{ ai_gen_id }} {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  @keyframes ai-announcement-pulse-{{ ai_gen_id }} {
    0%, 100% {
      transform: scale(1);
      opacity: {{ block.settings.separator_opacity | divided_by: 100.0 }};
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  @keyframes ai-announcement-rotate-{{ ai_gen_id }} {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes ai-announcement-bounce-{{ ai_gen_id }} {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  @keyframes ai-announcement-rainbow-{{ ai_gen_id }} {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  {% if block.settings.marquee_style == 'typewriter' %}
    .ai-announcement-item-{{ ai_gen_id }} {
      overflow: hidden;
      border-right: 2px solid {{ block.settings.text_color }};
      animation: ai-announcement-typewriter-{{ ai_gen_id }} 4s steps(40) infinite;
    }

    @keyframes ai-announcement-typewriter-{{ ai_gen_id }} {
      0%, 90%, 100% {
        width: 100%;
      }
      95% {
        border-right-color: transparent;
      }
    }
  {% endif %}

  @media (hover: hover) {
    {% if block.settings.pause_on_hover %}
      .ai-announcement-bar-{{ ai_gen_id }}:hover .ai-announcement-track-{{ ai_gen_id }} {
        animation-play-state: paused;
      }
    {% endif %}
    
    {% if block.settings.hover_effect == 'zoom' %}
      .ai-announcement-bar-{{ ai_gen_id }}:hover .ai-announcement-item-{{ ai_gen_id }} {
        transform: scale(1.05);
        transition: transform 0.3s ease;
      }
    {% elsif block.settings.hover_effect == 'glow' %}
      .ai-announcement-bar-{{ ai_gen_id }}:hover {
        box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        transition: box-shadow 0.3s ease;
      }
    {% endif %}
  }

  @media screen and (max-width: 749px) {
    .ai-announcement-bar-{{ ai_gen_id }} {
      height: {{ block.settings.bar_height_mobile }}px;
    }
    
    .ai-announcement-item-{{ ai_gen_id }} {
      font-size: {{ block.settings.text_size_mobile }}px;
      padding: 0 {{ block.settings.item_spacing | times: 0.8 }}px;
    }
    
    .ai-announcement-separator-{{ ai_gen_id }} {
      font-size: {{ block.settings.separator_size | times: 0.9 }}px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ai-announcement-track-{{ ai_gen_id }} {
      animation-duration: {{ block.settings.scroll_speed | times: 2 }}s;
    }
  }
{% endstyle %}

<div class="ai-announcement-bar-{{ ai_gen_id }}" {{ block.shopify_attributes }}>
  <div class="ai-announcement-track-{{ ai_gen_id }}">
    {% comment %} First set of announcements {% endcomment %}
    {% for i in (1..4) %}
      {% assign announcement_key = 'announcement_text_' | append: i %}
      {% assign announcement = block.settings[announcement_key] %}
      
      {% if announcement != blank %}
        {% if block.settings.separator != blank %}
          <span class="ai-announcement-separator-{{ ai_gen_id }}">{{ block.settings.separator }}</span>
        {% endif %}
        <div class="ai-announcement-item-{{ ai_gen_id }}">
          {{ announcement }}
        </div>
      {% endif %}
    {% endfor %}
    
    {% comment %} Duplicate set for seamless looping {% endcomment %}
    {% for i in (1..4) %}
      {% assign announcement_key = 'announcement_text_' | append: i %}
      {% assign announcement = block.settings[announcement_key] %}
      
      {% if announcement != blank %}
        {% if block.settings.separator != blank %}
          <span class="ai-announcement-separator-{{ ai_gen_id }}">{{ block.settings.separator }}</span>
        {% endif %}
        <div class="ai-announcement-item-{{ ai_gen_id }}">
          {{ announcement }}
        </div>
      {% endif %}
    {% endfor %}
  </div>
</div>

{% schema %}
{
  "name": "Scrolling Announcement",
  "tag": null,
  "settings": [
    {
      "type": "header",
      "content": "Announcement Messages"
    },
    {
      "type": "text",
      "id": "announcement_text_1",
      "label": "Message 1",
      "default": "Free shipping on all orders over $50"
    },
    {
      "type": "text",
      "id": "announcement_text_2",
      "label": "Message 2",
      "default": "Use code WELCOME10 for 10% off your first order"
    },
    {
      "type": "text",
      "id": "announcement_text_3",
      "label": "Message 3",
      "default": "Limited time offer - Shop now"
    },
    {
      "type": "text",
      "id": "announcement_text_4",
      "label": "Message 4",
      "default": "New arrivals every week"
    },
    {
      "type": "header",
      "content": "Separator"
    },
    {
      "type": "text",
      "id": "separator",
      "label": "Separator character",
      "default": "★",
      "info": "Character(s) to separate messages"
    },
    {
      "type": "select",
      "id": "separator_style",
      "label": "Separator animation",
      "options": [
        {
          "value": "none",
          "label": "None"
        },
        {
          "value": "pulse",
          "label": "Pulse"
        },
        {
          "value": "rotate",
          "label": "Rotate"
        },
        {
          "value": "bounce",
          "label": "Bounce"
        }
      ],
      "default": "pulse"
    },
    {
      "type": "range",
      "id": "separator_size",
      "min": 10,
      "max": 30,
      "step": 1,
      "unit": "px",
      "label": "Separator size",
      "default": 16
    },
    {
      "type": "range",
      "id": "separator_opacity",
      "min": 20,
      "max": 100,
      "step": 5,
      "unit": "%",
      "label": "Separator opacity",
      "default": 70
    },
    {
      "type": "range",
      "id": "separator_spacing",
      "min": 10,
      "max": 50,
      "step": 2,
      "unit": "px",
      "label": "Separator spacing",
      "default": 20
    },
    {
      "type": "color",
      "id": "separator_color",
      "label": "Separator color",
      "info": "Leave blank to use text color"
    },
    {
      "type": "header",
      "content": "Appearance"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background color",
      "default": "#000000"
    },
    {
      "type": "color_background",
      "id": "background_gradient",
      "label": "Background gradient",
      "info": "Gradient overrides background color"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text color",
      "default": "#FFFFFF"
    },
    {
      "type": "checkbox",
      "id": "rainbow_text",
      "label": "Rainbow text effect",
      "default": false,
      "info": "Overrides text color"
    },
    {
      "type": "checkbox",
      "id": "glow_effect",
      "label": "Text glow effect",
      "default": false
    },
    {
      "type": "color",
      "id": "glow_color",
      "label": "Glow color",
      "default": "#FFFFFF"
    },
    {
      "type": "checkbox",
      "id": "text_shadow",
      "label": "Text shadow",
      "default": false
    },
    {
      "type": "range",
      "id": "bar_height",
      "min": 30,
      "max": 100,
      "step": 2,
      "unit": "px",
      "label": "Bar height",
      "default": 40
    },
    {
      "type": "range",
      "id": "bar_height_mobile",
      "min": 30,
      "max": 80,
      "step": 2,
      "unit": "px",
      "label": "Bar height on mobile",
      "default": 36
    },
    {
      "type": "header",
      "content": "Typography"
    },
    {
      "type": "range",
      "id": "text_size",
      "min": 12,
      "max": 28,
      "step": 1,
      "unit": "px",
      "label": "Text size",
      "default": 14
    },
    {
      "type": "range",
      "id": "text_size_mobile",
      "min": 10,
      "max": 24,
      "step": 1,
      "unit": "px",
      "label": "Text size on mobile",
      "default": 12
    },
    {
      "type": "select",
      "id": "text_weight",
      "label": "Text weight",
      "options": [
        {
          "value": "300",
          "label": "Light"
        },
        {
          "value": "400",
          "label": "Regular"
        },
        {
          "value": "500",
          "label": "Medium"
        },
        {
          "value": "600",
          "label": "Semibold"
        },
        {
          "value": "700",
          "label": "Bold"
        }
      ],
      "default": "500"
    },
    {
      "type": "checkbox",
      "id": "uppercase_text",
      "label": "Uppercase text",
      "default": false
    },
    {
      "type": "range",
      "id": "letter_spacing",
      "min": 0,
      "max": 5,
      "step": 0.5,
      "unit": "px",
      "label": "Letter spacing",
      "default": 0
    },
    {
      "type": "range",
      "id": "item_spacing",
      "min": 20,
      "max": 120,
      "step": 5,
      "unit": "px",
      "label": "Message spacing",
      "default": 40
    },
    {
      "type": "header",
      "content": "Borders"
    },
    {
      "type": "checkbox",
      "id": "border_top_enabled",
      "label": "Show top border",
      "default": false
    },
    {
      "type": "checkbox",
      "id": "border_bottom_enabled",
      "label": "Show bottom border",
      "default": false
    },
    {
      "type": "range",
      "id": "border_width",
      "min": 1,
      "max": 5,
      "step": 1,
      "unit": "px",
      "label": "Border width",
      "default": 1
    },
    {
      "type": "color",
      "id": "border_color",
      "label": "Border color",
      "default": "#FFFFFF"
    },
    {
      "type": "header",
      "content": "Animation"
    },
    {
      "type": "select",
      "id": "scroll_direction",
      "label": "Scroll direction",
      "options": [
        {
          "value": "left",
          "label": "Right to left"
        },
        {
          "value": "right",
          "label": "Left to right"
        }
      ],
      "default": "left"
    },
    {
      "type": "range",
      "id": "scroll_speed",
      "min": 10,
      "max": 80,
      "step": 5,
      "unit": "s",
      "label": "Scroll speed (lower is faster)",
      "default": 30
    },
    {
      "type": "checkbox",
      "id": "pause_on_hover",
      "label": "Pause on hover",
      "default": true
    },
    {
      "type": "select",
      "id": "hover_effect",
      "label": "Hover effect",
      "options": [
        {
          "value": "none",
          "label": "None"
        },
        {
          "value": "zoom",
          "label": "Zoom text"
        },
        {
          "value": "glow",
          "label": "Glow background"
        }
      ],
      "default": "none"
    }
  ],
  "presets": [
    {
      "name": "Scrolling Announcement"
    }
  ]
}
{% endschema %}