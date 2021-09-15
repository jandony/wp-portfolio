( function( $ ) {
	// Add Upgrade Message to Customizer Header
	if ('undefined' !== typeof wp_portfolioproupgrade) {
		upsell = $('<a class="wp_portfolio-upgrade-link"></a>')
			.attr('href', wp_portfolioproupgrade.wp_portfolioprourl)
			.attr('target', '_blank')
			.text(wp_portfolioproupgrade.wp_portfolioprolabel)
			.css({
				'padding': '3px 12px 2px',
				'display': 'inline-block',
				'color': '#fff',
				'background-color': 'rgb(142, 181, 76)',
				'margin-top': '6px',
				'-webkit-border-radius': '2px',
				'-moz-border-radius': '2px',
				'border-radius': '2px',
				'font-size': '12px',
				'text-transform': 'uppercase'
			})
		;
		setTimeout(function () {
			$('.preview-notice').append(upsell);
		}, 200);
		// Remove accordion click event
		$('.preview-notice').on('click', function(e) {
			e.stopPropagation();
		});
	}
} )( jQuery );