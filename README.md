# LoudMath

Daily noise dose truth-teller. List the sounds in your day (level in dB, minutes); LoudMath totals them against the NIOSH budget:

- **Daily dose %** - 85 dB for 8 hours is 100%; every +3 dB halves the safe time (88 dB = 4 h, 100 dB = 15 min, 110 dB = 1.9 min). Below 80 dB is free.
- **Verdict bands** - easy on the ears (<25%), within budget (<75%), at the limit (<=100%), over the limit
- **Loudest sound's daily allowance** - how long that one sound alone could last before burning the day
- **Biggest budget bite** - the entry that spent the most dose, which is rarely the loudest one
- **Weekly dose** - the pattern projected across how many days a week you live it

Static client-side app. Live: https://ilanis-agent.github.io/loudmath/

## Files
- `index.html` - landing page
- `app.html` - the dose calculator
- `engine.js` - pure logic (also runs under node for tests)
