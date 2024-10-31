const pricePattern = /\d{1,3}(\,\d{2})?\s?€/g;
const elements = document.querySelectorAll("body *");  // Select all elements in the body

elements.forEach(element => {
    // If the element has child elements, we need a more complex approach
    if ((element.children.length > 0) && (element.classList.contains('product-price__price'))) {
        // Check if the element contains a valid price pattern followed by a <sup> tag
        // console.log("1",element.firstChild.data)
        // Find the price text and remove the € symbol for conversion
        let priceText = element.firstChild.data.match(pricePattern)[0];
        let originalPrice = priceText.replace('€', '').replace(',', '.').trim();

        let roundedPrice = roundPrice(Number(originalPrice)); // Round the price
        
        // Replace the original price in the element's HTML, keeping the <sup> tag intact
        element.firstChild.data = element.firstChild.data.replace(priceText, roundedPrice.toFixed(2).replace(".", ",") + '€');
    }
    // amazon
    else if((element.children.length > 0) && (element.classList.contains('a-price'))){
        let priceContainer = element.querySelector('span[aria-hidden="true"]');
        if (priceContainer.children.length > 0){ // ignore simple prices
            //reconstruct the price from amazon weird price display
            let priceText = (priceContainer.getElementsByClassName('a-price-whole')[0].textContent + "," + priceContainer.getElementsByClassName('a-price-fraction')[0].textContent).replace(',,',',').replace(",",".");
            let roundedPrice = roundPrice(Number(priceText)); // Round the price
            priceContainer.innerHTML = roundedPrice.toFixed(2).replace(".", ",") + '€' // replace the complicated spans with some texts
        }
    }
    // For elements without children (like in your original code)
    else if (element.children.length==0 && element.textContent.match(pricePattern)) {
        // console.log("2",element.textContent)

        let prices = element.textContent.match(pricePattern);

        prices.forEach(price => {
            let originalPrice = price.replace('€', '').replace(',', '.'); // Remove € and replace , with .

            let roundedPrice = roundPrice(Number(originalPrice)); // Round the price

            // Replace the original price in the element's text content
            element.textContent = element.textContent.replace(price, roundedPrice.toFixed(2).replace(".", ",") + '€');
        });
    }
});

function roundPrice(price) {
    // console.log(price);

    // For prices over 80, round to the nearest ten if the units are close to rounding up (88€ => 90€)
    if (price > 80 && price % 10 > 7) {
        price = Math.ceil(price / 10) * 10;
    }

    // Round to the nearest whole number if cents are >= 0.85
    else if (price % 1 >= 0.85) {
        price = Math.round(price);
    }

    // Round to the nearest 0.1 if cents in tenths place are close to rounding up (e.g., 4.49 to 4.50)
    else if (price % 0.1 > 0.089) {
        price = Number(price.toFixed(1));
    }

    // console.log("=> ", price);
    return price;
}


