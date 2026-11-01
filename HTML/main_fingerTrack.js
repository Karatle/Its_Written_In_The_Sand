//if dom ready, add event listener to the body to check if the screen is mobile


const htmlTargetFingertrack = document.querySelector('#gridFingerTrack')

let targetFPS = 30;

let fingerTrackExec = true
let searchingExec = true
let asiaVisExec = true
let questionmarkExec = true

let visualIndex = 0;
let visMax = 3;
let visSwitch = true;

let TDdata
let pixelFingerVals
let pixelDepthVals
let fingerVals

let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let letterControls_fingertrack = []
let counterx = 0
let countery = 0
let counterNoise = 0
let noisePosx = 0
let noisePosy = 0

let asiaNoiseTrail = 0
let asiaNoiseRotation = 0
let asiaNoiseWeight = 0

let noiseFade = 0

let collider_x = 0
let collider_y = 0
let collider_x_Previous = 0
let collider_y_Previous = 0
let direction_angle = 0

let weightThreshholdMin = 300
let weightThreshholdMax = 600
let trailThreshholdMin = 0
let trailThreshholdMax = 100

let collisionThreshold = .8
let weakCollisionThreshold = 1.1

let fingerActive

//–––––––––––server_logic–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
var host = location.hostname;
// console.log("Host : ", host);
var ws = new WebSocket('ws://' + host + ':5050');

ws.onmessage = async function (event) {
    var receivedMessage = event.data;

    if (receivedMessage instanceof Blob) {
        receivedMessage = await receivedMessage.text();
    }
    TDdata = JSON.parse(receivedMessage)
    // console.log(TDdata.pixels);
    pixelFingerVals = TDdata.pixelsFinger
    pixelDepthVals = TDdata.pixelsDepth
    fingerVals = TDdata.finger
    fingerActive = TDdata.active
}

//–––––––––––fingertracking–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

class LetterControls_fingertrack {
    constructor(id, swapSpeed, x, y) {
        this.id = id
        this.x = x
        this.y = y
        this.swapSpeed = swapSpeed
        this.oncoolDown = false
        this.debug = false

        this.colBase = [228, 87, 64]
        this.colAlt = [234, 193, 44]
        this.colDepth = [0, 0, 0]
        this.colSC = [12, 15, 10]
        this.colWC = [108, 58, 92]

        this.typoColor = [12, 15, 10]
        this.typoColorCollision = [228, 87, 64]

        this.currentCol = [10, 10, 10]
        this.depth = 0

        this.weight = 300
        this.trail = 0
        this.globalAngle = 0
        this.angle = 0

        this.alpha = 0

        this.collision = false
        this.strongCollision = false
        this.weakCollision = false
        this.collisionPulse = false
        this.collisionPulseReset = true

        this.noiseFade = 1
    }

    run() {
        setInterval(() => {
            this.swapSpeed = Math.floor(map_range(Math.random(), 0, 1, 100, 1000)) // set new cooldown time
            document.getElementById(`item_fingerTrack-${this.id}`).innerHTML = alphabet[Math.floor(Math.random() * alphabet.length)]; // switch letters
        }, this.swapSpeed)

        setInterval(() => {
            if (this.collision == true) {
                if (this.alpha < 1) {
                    this.alpha += .1
                }
                if (this.weight < weightThreshholdMax) { //grow weight if current weight is below max
                    if (this.weakCollision) { // weak coll
                        this.weight += 3
                    }
                    if (this.strongCollision) { // strong coll
                        this.weight += 20
                    }
                }
                if (this.weakCollision) {
                    document.getElementById(`item_fingerTrack-${this.id}`).style.backgroundColor = colorMixer(this.colWC, this.colBase, this.alpha)
                    this.currentCol = this.colWC
                }
                if (this.strongCollision) {
                    document.getElementById(`item_fingerTrack-${this.id}`).style.backgroundColor = colorMixer(this.colSC, this.colBase, this.alpha)
                    this.currentCol = this.colSC

                }
                if (this.trail < 100) {
                    this.trail += 5
                }
                if (this.collision && this.collisionPulseReset) { //if reset is available ()
                    this.collisionPulse = true
                    this.collisionPulseReset = false
                }
                if (this.collisionPulse) {
                    this.angle = this.globalAngle
                    this.collisionPulse = false
                }
                document.getElementById(`item_fingerTrack-${this.id}`).style.color = `rgba(218, 255, 105, 1)`
            }
            if (this.collision == false) {
                if (this.alpha > 0) {
                    this.alpha -= .02
                }
                document.getElementById(`item_fingerTrack-${this.id}`).style.color = `rgba(${this.colSC[0]}, ${this.colSC[1]}, ${this.colSC[2]})`
                document.getElementById(`item_fingerTrack-${this.id}`).style.backgroundColor = colorMixer(this.currentCol, this.colDepth, this.alpha)

                if (this.weight > weightThreshholdMin) { //shrink weight if current weight is above min
                    this.weight -= 10
                    this.collisionPulseReset = true
                }
                if (this.trail > 0) {
                    this.trail -= 1
                }
            }
            document.getElementById(`item_fingerTrack-${this.id}`).style.fontVariationSettings = `'SIZE' ${this.trail}, 'wght' ${this.weight}, 'ROTA' ${this.angle}`
            document.getElementById(`item_fingerTrack-${this.id}`).style.filter = `opacity(${this.noiseFade})`

        }, 1000 / targetFPS)

    }
}

for (var iter = 0; iter < 100; iter++) { // intiate lettercontrol classes and fill html grid with letter instances
    let htmlLetterElmt = `<div class="grid-item-fingerTrack grid-item-fingerTrack-text" id="item_fingerTrack-${iter}">a</div>`;
    //coordinate system
    x = Math.floor(fract(iter / 10) * 10) //eg 19/10 = 1.9 -> fract(1.9) = .9 -> .9 * 10 = 9 = x
    y = Math.floor(iter / 10) //eg 19/10 = 1.9 -> floor(1.9) = 1 = y

    letterControls_fingertrack.push(new LetterControls_fingertrack(iter, Math.floor(map_range(Math.random(), 0, 1, 100, 1000)), x, y))
    htmlTargetFingertrack.innerHTML += htmlLetterElmt

}


setInterval(() => {
    counterx += map_range(Math.random(), 0, 1, 0.001, .04) // varying anim speed
    countery += map_range(Math.random(), 0, 1, 0.001, .04)

    collider_x_Previous = collider_x // comparator to calc direction
    collider_y_Previous = collider_y

    collider_x = TDdata.finger[0] // animate collider pos
    collider_y = TDdata.finger[1]

    direction_angle = 180 - (((Math.atan2(collider_y_Previous - collider_y, collider_x_Previous - collider_x) * 180)) / Math.PI) // calc direction (normalize [0, 360] with 180, otherwise [-180, 180])

    // console.log(direction_angle)

    for (let lcCoord = 0; lcCoord < letterControls_fingertrack.length; lcCoord++) {

        letterControls_fingertrack[lcCoord].globalAngle = direction_angle

        if (TDdata.pixelsFinger[lcCoord] == 1) {
            letterControls_fingertrack[lcCoord].collision = true
            letterControls_fingertrack[lcCoord].strongCollision = true
        } else if (TDdata.pixelsFinger[lcCoord] == 0.5) {
            letterControls_fingertrack[lcCoord].collision = true
            letterControls_fingertrack[lcCoord].weakCollision = true
        } else {
            letterControls_fingertrack[lcCoord].collision = false
            letterControls_fingertrack[lcCoord].weakCollision = false
            letterControls_fingertrack[lcCoord].strongCollision = false
        }
        // letterControls_fingertrack[lcCoord].depth = pixelDepthVals[lcCoord]
        letterControls_fingertrack[lcCoord].colDepth = [letterControls_fingertrack[lcCoord].colBase[0],
        letterControls_fingertrack[lcCoord].colBase[1] + (pixelDepthVals[lcCoord] * 100) - 50,
        // letterControls_fingertrack[lcCoord].colBase[1],
        letterControls_fingertrack[lcCoord].colBase[2]]

    }
    //switch visual logic

    // if (fingerActive > 0) {
    //     for (let lcf of letterControls_fingertrack) {
    //         lcf.execute = true
    //     }
    // } else {
    //     for (let lcf of letterControls_fingertrack) {
    //         lcf.execute = false
    //     }
    // }


    if (fingerActive <= 0.5) {
        visSwitch = true
    }
    if (fingerActive >= .92 && visSwitch == true) {
        visualIndex++
        visSwitch = false
    }
    if (visualIndex == visMax) {
        visualIndex = 0
    }
    // console.log(letterControls_fingertrack[0].execute)
}, 1000 / targetFPS);

if (fingerTrackExec == true) {
    for (var lc = 0; lc < letterControls_fingertrack.length; lc++) {
        letterControls_fingertrack[lc].run()
    }
}

//–––––––––––vis_searching–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

const htmlTargetSearching = document.querySelector('#gridSearching')

// let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let letterControls_searching = []

let counterNoise_2 = 0
let counterRamp = 0

let counterXCoord = 0
let counterYCoord = 0

class LetterControls_searching {
    constructor(id, swapSpeed, x, y) {
        this.id = id
        this.x = x
        this.y = y
        this.color

        this.weight = 300
        this.trail = 0
        this.angle = 90
        this.letterSpacing = 0
        this.noisePos = 0
        this.noisePos_2 = 0
        this.blur = 0
    }
    run() {
        setInterval(() => {

            if (this.noisePos > .01) {
                document.getElementById(`item_searching-${this.id}`).innerHTML = '?????????'
            } else {
                document.getElementById(`item_searching-${this.id}`).innerHTML = 'SEARCHING'
            }
            document.getElementById(`item_searching-${this.id}`).style.color = this.color

            // this.blur = map_range(this.noisePos, 0, 1, 6, 0)
            this.trail = map_range(this.noisePos, 0, 1, 0, 100)
            this.weight = map_range(this.noisePos_2, 0, 1, 100, 700)
            // document.getElementById(`item_searching-${this.id}`).style.filter = `blur(${this.blur}px)`
            document.getElementById(`item_searching-${this.id}`).style.letterSpacing = `${this.letterSpacing}rem`
            document.getElementById(`item_searching-${this.id}`).style.fontVariationSettings = `'SIZE' ${this.trail}, 'wght' ${this.weight}, 'ROTA' ${this.angle}`

        }, 1000 / targetFPS)

    }
}

// intiate lettercontrol classes and fill html grid with letter instances
if (searchingExec == true) {
    for (var iter = 0; iter < 22; iter++) {
        let htmlLetterElmt = `<div class="grid-item-searching grid-item-searching-text" id="item_searching-${iter}">SEARCHING</div>`;

        //coordinate system
        if (counterXCoord > 1) {
            counterXCoord = 0
            counterYCoord++
        }
        y = counterYCoord //eg 19/10 = 1.9 -> floor(1.9) = 1 = y
        x = counterXCoord
        counterXCoord++

        letterControls_searching.push(new LetterControls_searching(iter, Math.floor(map_range(Math.random(), 0, 1, 100, 1000)), x, y))
        htmlTargetSearching.innerHTML += htmlLetterElmt
    }

    document.querySelector(`#gridSearching`).style.backgroundColor = `rgba(0, 0, 0, 1)`

    for (var lc = 0; lc < letterControls_searching.length; lc++) {
        letterControls_searching[lc].run()
    } // execute lettercontrol dynamics
}

//–––––––––––vis_questionmark–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

const htmlTargetQuestionmark = document.getElementById('gridQuestionmark')
const htmlTargetQuestionmark2 = document.getElementById('gridQuestionmark1')
const htmlTargetQuestionmark3 = document.getElementById('gridQuestionmark2')
const htmlTargetQuestionmark4 = document.getElementById('gridQuestionmark3')

let letterControls_questionMark = []

class LetterControls_questionMark {
    constructor(id, swapSpeed, x, y) {
        this.id = id
        this.color
        this.interval = 2000 + Math.random() * 1000

        this.weight = 600
        this.height = 30
        this.heightCurrent = 30
        this.heightPrev = 0
        this.heightDiff = 0
        this.trail = 100
        this.angle = 90
        this.letterSpacing = 0
        this.noisePos = 0
        this.noisePos_2 = 0
        this.blur = 0
        this.size = 30
        this.fontScalar = 1.2
        this.heightScalar = .8
        this.widthScalar = .7
    }
    run() {
        setInterval(() => {
            this.heightPrev = this.heightCurrent
            this.size = 10 + (Math.random() * 30)
            this.heightCurrent = this.size
            this.heightDiff = this.heightPrev - this.heightCurrent
            // this.interval = 2000 + Math.random() * 2000
        }, this.interval)

        setInterval(() => {
            //ease transition value
            this.height += this.heightDiff / (targetFPS * (this.interval / 1000))
            // this.height = clamp(this.height, 20, 40)

            document.getElementById(`item_questionmark-${this.id}`).style.height = `${this.height * this.heightScalar}%`
            document.getElementById(`item_questionmark-${this.id}`).style.fontSize = `${this.height * this.fontScalar}vh`
            document.getElementById(`item_questionmark-${this.id}`).style.width = `${this.height * this.widthScalar}%`

            document.getElementById(`item_questionmark-${this.id + 100}`).style.height = `${this.height * this.heightScalar}%`
            document.getElementById(`item_questionmark-${this.id + 100}`).style.fontSize = `${this.height * this.fontScalar}vh`
            document.getElementById(`item_questionmark-${this.id + 100}`).style.width = `${this.height * this.widthScalar}%`

            document.getElementById(`item_questionmark-${this.id + 200}`).style.height = `${this.height * this.heightScalar}%`
            document.getElementById(`item_questionmark-${this.id + 200}`).style.fontSize = `${this.height * this.fontScalar}vh`
            document.getElementById(`item_questionmark-${this.id + 200}`).style.width = `${this.height * this.widthScalar}%`

            document.getElementById(`item_questionmark-${this.id + 300}`).style.height = `${this.height * this.heightScalar}%`
            document.getElementById(`item_questionmark-${this.id + 300}`).style.fontSize = `${this.height * this.fontScalar}vh`
            document.getElementById(`item_questionmark-${this.id + 300}`).style.width = `${this.height * this.widthScalar}%`


            // this.blur = map_range(this.noisePos, 0, 1, 6, 0)
            // this.trail = map_range(this.noisePos, 0, 1, 0, 100)
            // this.weight = map_range(this.noisePos_2, 0, 1, 100, 700)
            // document.getElementById(`item_questionmark-${this.id}`).style.letterSpacing = `${this.letterSpacing}rem`
            // document.getElementById(`item_questionmark-${this.id + 100}`).style.letterSpacing = `${this.letterSpacing}rem`
            // document.getElementById(`item_questionmark-${this.id + 200}`).style.letterSpacing = `${this.letterSpacing}rem`
            // document.getElementById(`item_questionmark-${this.id + 300}`).style.letterSpacing = `${this.letterSpacing}rem`

            document.getElementById(`item_questionmark-${this.id}`).style.fontVariationSettings = `'SIZE' ${this.trail}, 'wght' ${this.weight}, 'ROTA' ${this.angle}`
            document.getElementById(`item_questionmark-${this.id + 100}`).style.fontVariationSettings = `'SIZE' ${this.trail - (this.trail * .33)}, 'wght' ${this.weight - ((this.weight * .5) * .33)}, 'ROTA' ${this.angle}`
            document.getElementById(`item_questionmark-${this.id + 200}`).style.fontVariationSettings = `'SIZE' ${this.trail - (this.trail * .66)}, 'wght' ${this.weight - ((this.weight * .5) * .8)}, 'ROTA' ${this.angle}`
            document.getElementById(`item_questionmark-${this.id + 300}`).style.fontVariationSettings = `'SIZE' ${this.trail - (this.trail)}, 'wght' ${this.weight - ((this.weight * .5))}, 'ROTA' ${this.angle}`
        }, 1000 / targetFPS)

    }
}

// intiate lettercontrol classes and fill html grid with letter instances
for (var iter = 0; iter < 10; iter++) {
    let htmlLetterElmt = `<div class="grid-item-questionmark grid-item-questionmark-text" id="item_questionmark-${iter}">?</div>`;
    let htmlLetterElmt2 = `<div class="grid-item-questionmark grid-item-questionmark-text" id="item_questionmark-${iter + 100}">?</div>`;
    let htmlLetterElmt3 = `<div class="grid-item-questionmark grid-item-questionmark-text" id="item_questionmark-${iter + 200}">?</div>`;
    let htmlLetterElmt4 = `<div class="grid-item-questionmark grid-item-questionmark-text" id="item_questionmark-${iter + 300}">?</div>`;
    //coordinate system
    // if (counterXCoord > 1) {
    //     counterXCoord = 0
    //     counterYCoord++
    // }
    // y = counterYCoord //eg 19/10 = 1.9 -> floor(1.9) = 1 = y
    // x = counterXCoord
    // counterXCoord++

    letterControls_questionMark.push(new LetterControls_questionMark(iter, Math.floor(map_range(Math.random(), 0, 1, 100, 1000))))
    htmlTargetQuestionmark.innerHTML += htmlLetterElmt
    htmlTargetQuestionmark2.innerHTML += htmlLetterElmt2
    htmlTargetQuestionmark3.innerHTML += htmlLetterElmt3
    htmlTargetQuestionmark4.innerHTML += htmlLetterElmt4
}

if (questionmarkExec == true) {
    for (var lc = 0; lc < letterControls_questionMark.length; lc++) {
        document.getElementById(`item_questionmark-${lc}`).style.color = `rgb(${228}, ${87}, ${46})`
        document.getElementById(`item_questionmark-${lc + 100}`).style.color = `rgb(${108}, ${58}, ${92})`
        document.getElementById(`item_questionmark-${lc + 200}`).style.color = `rgb(${21}, ${206}, ${126})`
        document.getElementById(`item_questionmark-${lc + 300}`).style.color = `rgb(${12}, ${15}, ${10})`
        // document.getElementById(`item_questionmark-${lc}`).style.color = `rgb(${228}, ${87}, ${46})`
        // document.getElementById(`item_questionmark-${lc + 100}`).style.color = `rgb(${100}, ${45}, ${242})`
        // document.getElementById(`item_questionmark-${lc + 200}`).style.color = `rgb(${175}, ${233}, ${0})`
        // document.getElementById(`item_questionmark-${lc + 300}`).style.color = `rgb(${12}, ${15}, ${10})`

        letterControls_questionMark[lc].run()
    } // execute lettercontrol dynamics
}

//–––––––––––Asia_Visctrl–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

setInterval(() => {

    document.getElementById(`text`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail}, 'wght' ${asiaNoiseWeight}, 'ROTA' ${asiaNoiseRotation}`
    document.getElementById(`text2`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail * (1 / 3)}, 'wght' ${asiaNoiseWeight - 100}, 'ROTA' ${asiaNoiseRotation}`
    document.getElementById(`text3`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail * ((1 / 3) * 2)}, 'wght' ${asiaNoiseWeight - 200}, 'ROTA' ${asiaNoiseRotation}`

}, 1000 / targetFPS)

//–––––––––––vis_cycle–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

setInterval(() => {
    if (visualIndex == 0) {
        document.getElementById(`gridSearching`).style.filter = `opacity(${1})`
        document.querySelector(`.overflowGrid`).style.filter = `opacity(${0})`
        document.getElementById(`container1`).style.filter = `opacity(${0})`
        document.getElementById(`container2`).style.filter = `opacity(${0})`
        document.getElementById(`container3`).style.filter = `opacity(${0})`
    }
    if (visualIndex == 1) {
        document.getElementById(`gridSearching`).style.filter = `opacity(${0})`
        document.querySelector(`.overflowGrid`).style.filter = `opacity(${1})`
        document.getElementById(`container1`).style.filter = `opacity(${0})`
        document.getElementById(`container2`).style.filter = `opacity(${0})`
        document.getElementById(`container3`).style.filter = `opacity(${0})`
    }
    if (visualIndex == 2) {
        document.getElementById(`gridSearching`).style.filter = `opacity(${0})`
        document.querySelector(`.overflowGrid`).style.filter = `opacity(${0})`
        document.getElementById(`container1`).style.filter = `opacity(${1})`
        document.getElementById(`container2`).style.filter = `opacity(${1})`
        document.getElementById(`container3`).style.filter = `opacity(${1})`
    }
}, 1000 / targetFPS)

//–––––––––––p5–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function setup(){
    frameRate(30)
}

function draw() {

    let C1 = color(0, 250, 140);
    // let C2 = color(170, 0, 255);
    let C2 = color(100, 45, 242);
    let col
    counterNoise += 0.05 * .5
    counterNoise_2 += 0.001 * .5
    counterRamp += 0.02 * .5

    for (let lcNoiseFade = 0; lcNoiseFade < letterControls_fingertrack.length; lcNoiseFade++) {
        if (letterControls_fingertrack[lcNoiseFade].strongCollision == false && letterControls_fingertrack[lcNoiseFade].weakCollision == false) {
            letterControls_fingertrack[lcNoiseFade].noiseFade = Math.floor((noise(lcNoiseFade * .2 + 1) * fingerActive) + fingerActive)
        }
        if (fingerActive > 0 && letterControls_fingertrack[lcNoiseFade].strongCollision == true || letterControls_fingertrack[lcNoiseFade].weakCollision == true) {
            letterControls_fingertrack[lcNoiseFade].noiseFade = 1
        }
    }

    for (let lcCoordSearching = 0; lcCoordSearching < letterControls_searching.length; lcCoordSearching++) {
        let fractId = fract(letterControls_searching[lcCoordSearching].y / 11 + counterRamp)
        let fractIdRev = fract(letterControls_searching[lcCoordSearching].y / 11 - counterRamp)
        let fractIdSin = map_range(sin(map_range(fract(letterControls_searching[lcCoordSearching].y / 10 + (counterRamp * .5)), 0, 1, 0, 2 * Math.PI)), -1, 1, 0, 1)
        let fractIdRevSin = map_range(sin(map_range(fract(letterControls_searching[lcCoordSearching].y / 10 - (counterRamp * .5)), 0, 1, 0, 2 * Math.PI)), -1, 1, 0, 1)

        if (letterControls_searching[lcCoordSearching].x == 0) { //wave
            col = lerpColor(C1, C2, fractIdSin)
            letterControls_searching[lcCoordSearching].noisePos = 1 - fractIdSin
            letterControls_searching[lcCoordSearching].noisePos_2 = fractIdSin
            letterControls_searching[lcCoordSearching].angle = (1 - fractIdSin) * 180
            letterControls_searching[lcCoordSearching].letterSpacing = (1 - fractIdSin) * .2
        }
        if (letterControls_searching[lcCoordSearching].x == 1) {
            col = lerpColor(C1, C2, 1 - fractIdRevSin)
            letterControls_searching[lcCoordSearching].noisePos = fractIdRevSin
            letterControls_searching[lcCoordSearching].noisePos_2 = 1 - fractIdRevSin
            letterControls_searching[lcCoordSearching].angle = (fractIdSin) * 180
            letterControls_searching[lcCoordSearching].letterSpacing = (fractIdSin) * .2
        }
        letterControls_searching[lcCoordSearching].color = col.toString()
    }
    // document.querySelector('.gridQuestionmark').style.left = `${map_range(noise(counterNoise * .2), 0, 1, -50, 50)}%`
    // document.querySelector('.gridQuestionmark').style.top = `${map_range(noise(counterNoise * .2 + 1000), 0, 1, -50, 50)}%`
    asiaNoiseTrail = map_range(noise(counterNoise + 100), 0, 1, 0, 100)
    asiaNoiseRotation = map_range(noise(counterNoise + 300), 0, 1, 0, 360)
    asiaNoiseWeight = map_range(noise(counterNoise + 500), 0, 1, 300, 600)

    // document.getElementById(`text`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail}, 'wght' ${asiaNoiseWeight}, 'ROTA' ${asiaNoiseRotation}`
    // document.getElementById(`text2`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail * (1 / 3)}, 'wght' ${asiaNoiseWeight - 100}, 'ROTA' ${asiaNoiseRotation}`
    // document.getElementById(`text3`).style.fontVariationSettings = `'SIZE' ${asiaNoiseTrail * ((1 / 3) * 2)}, 'wght' ${asiaNoiseWeight - 200}, 'ROTA' ${asiaNoiseRotation}`
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
function clamp(number, lower, upper) {
    return Math.min(Math.max(number, lower), upper)
}
function fract(f) {
    return f % 1;
}

function colorChannelMixer(colorChannelA, colorChannelB, amountToMix) {
    var channelA = colorChannelA * amountToMix;
    var channelB = colorChannelB * (1 - amountToMix);
    return parseInt(channelA + channelB);
}
//rgbA and rgbB are arrays, amountToMix ranges from 0.0 to 1.0
//example (red): rgbA = [255,0,0]
function colorMixer(rgbA, rgbB, amountToMix) {
    var r = colorChannelMixer(rgbA[0], rgbB[0], amountToMix);
    var g = colorChannelMixer(rgbA[1], rgbB[1], amountToMix);
    var b = colorChannelMixer(rgbA[2], rgbB[2], amountToMix);
    return "rgba(" + r + "," + g + "," + b + ", " + 1 + ")";
}
