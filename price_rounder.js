const pricePattern = /\d{1,3}(\,\d{2})?\s?€/g;
const elements = document.querySelectorAll("body *");  // Select all elements in the body

elements.forEach(element => {
    // Skip elements that are not likely to contain text (like <input>)
    if (element.children.length === 0 && element.textContent.match(pricePattern)) {
        let prices = element.textContent.match(pricePattern);
        
        prices.forEach(price => {
            
            let originalPrice = price.replace('€','');  // Remove any currency symbol
            originalPrice = originalPrice.replace(',','.') // Replace the , by a . to perform operations
            

            let roundedPrice = roundPrice(Number(originalPrice));  // Round the price
            
            // Replace the original price in the element's text
            element.textContent = element.textContent.replace(price, roundedPrice.toFixed(2).replace(".",",") + '€');
        });
    }
});

function roundPrice(price) {
    // console.log(price);

    // For prices over 80, round to the nearest ten if the units are close to rounding up
    if (price > 80) {
        let units = price % 10;
        if (units > 7) {
            price = Math.ceil(price / 10) * 10;
        }
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
