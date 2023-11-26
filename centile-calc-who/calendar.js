const dp = TinyDatePicker('.date-of-birth', {

    // convert to NZ date format
    format(date) {
        return date.toLocaleDateString('en-NZ');
    },

    // parse {string|Date} -> Date is the inverse of format. If you specify one, you probably should specify the other
    // the default parse function handles whatever the new Date constructor handles. Note that
    // parse may be passed either a string or a date.
    parse(str) {
        const parts = str.split('/');
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        return isNaN(date) ? new Date() : date;
    },

    // 'dp-modal' displays the picker as a modal, 'dp-below' displays the date picker as a dropdown
    mode: 'dp-below',

    // set maximum date to Today
    max: new Date(),

    })

const dm = TinyDatePicker('.date-of-measurement', {

    // convert to NZ date format
    format(date) {
        return date.toLocaleDateString('en-NZ');
    },

    // parse {string|Date} -> Date is the inverse of format. If you specify one, you probably should specify the other
    // the default parse function handles whatever the new Date constructor handles. Note that
    // parse may be passed either a string or a date.
    parse(str) {
        const parts = str.split('/');
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        return isNaN(date) ? new Date() : date;
    },


    // 'dp-modal' displays the picker as a modal, 'dp-below' displays the date picker as a dropdown
    mode: 'dp-below',

    // set maximum date to Today
    max: new Date(),

})

//add todays date to date of measurement
var today = new Date();
today = moment(today).format("DD/MM/YYYY");
document.getElementById("DOM").value = today;
