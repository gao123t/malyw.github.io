// Modules to load the the talks data,
// parse it
// and populate to the element using templating

class TalksData {
    constructor(talksDataEl) {
        TalksData.loadTalksData()
            .then((talksJson) => {
                this.initComponent({talksDataEl, talksJson});
            });
    }

    static loadTalksData() {
        return fetch('/js/assets/talks-data.json')
            .then((res) => res.json())
            .catch(console.error);
    }

    initComponent({talksDataEl, talksJson}) {
        this.talksDataEl = talksDataEl;

        this.talksJson = talksJson;

        // PREPARE DATA
        this.talksJson = TalksData.addDateToTalks(this.talksJson);

        // filter if needed
        if (this.talksDataEl.classList.contains('upcoming-only')) {
            this.talksJson = this.leaveUpcomingOnly();
            this.checkUpcomingTalksPresent(this.talksJson, this.talksDataEl);
        }

        if (this.talksDataEl.classList.contains('previous-only')) {
            this.talksJson = this.leavePreviousOnly();
        }


        // INIT
        this.forEachTalkEl = this.talksDataEl.querySelector('.for-each-talk');
        this.forEachTalkEl.parentNode.removeChild(this.forEachTalkEl);// remove from the output

        this.populateData();

        this.talksDataEl.classList.add('loaded');
    }

    /**
     * Checks if there are upcoming talks and hides dedicated closest specific parent otherwise
     */
    checkUpcomingTalksPresent() {
        if (this.talksJson.length === 0) {
            this.talksDataEl.closest('.js-talks-data_upcoming-only__hide-when-empty').style.display = 'none';
        }
    }

    leaveUpcomingOnly() {
        return this.talksJson
            .filter(talkJson => TalksData.isTalkUpcoming(talkJson))

            // in JSON talks start from the latest planned event, but upcoming in UI should be shown starting form the closest
            .reverse();
    }

    leavePreviousOnly() {
        return this.talksJson.filter(talkJson => !TalksData.isTalkUpcoming(talkJson));
    }

    // add "date": "monthName year" fields
    static addDateToTalks(talksJson) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        talksJson.forEach((talkJson) => {
            const monthName = months[Number(talkJson.month) - 1];// "- 1" as in JS months start from 0

            talkJson.date = `${monthName} ${talkJson.year}`;
        });
        return talksJson;
    }

    static isTalkUpcoming(talkJSON) {
        const talkYear = Number(talkJSON.year);
        const talkMonth = Number(talkJSON.month);
        const currentYear = (new Date()).getFullYear();
        const currentMonth = (new Date()).getMonth() + 1; // "+ 1" as starts from 0

        if (talkYear > currentYear) { // a future year
            return true;
        }
        if (talkYear === currentYear) { // the current year
            return talkMonth >= currentMonth; // "true" if the current or a future month in this year
        }

        return false; // earlier than the current month
    }

    populateData() {
        this.talksJson.forEach(this.populateTalkData.bind(this));
    }

    populateTalkData(talkJSON) {
        const talkEl = this.forEachTalkEl.cloneNode(true);

        // populate field placeholders in HTML
        for (const fieldName in talkJSON) {
            if (talkJSON.hasOwnProperty(fieldName)) {
                const fieldValue = talkJSON[fieldName];

                talkEl.innerHTML = talkEl.innerHTML.replace(new RegExp(`%%${fieldName}%%`, 'g'), fieldValue);
            }
        }

        // populate upcoming data
        const isTalkUpcoming = TalksData.isTalkUpcoming(talkJSON);
        const upcomingEl = talkEl.querySelector('.show-if-upcoming');
        if (upcomingEl) {
            upcomingEl.hidden = !isTalkUpcoming; // hide if talk is not upcoming
        }

        // start loading images after populating the urls
        const preSrcEls = Array.from(talkEl.querySelectorAll('.pre-src'));
        preSrcEls.forEach((preSrcEl) => {
            preSrcEl.setAttribute('src', preSrcEl.getAttribute('pre-src'));
            preSrcEl.removeAttribute('pre-src');
        });

        // append the result
        this.talksDataEl.appendChild(talkEl);
    }
}

export default TalksData;