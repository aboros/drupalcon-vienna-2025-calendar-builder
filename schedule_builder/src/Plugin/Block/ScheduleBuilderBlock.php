<?php

namespace Drupal\schedule_builder\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

/**
 * Provides a Schedule Builder block.
 *
 * @Block(
 *   id = "schedule_builder",
 *   admin_label = @Translation("Schedule Builder"),
 *   category = @Translation("Custom")
 * )
 */
class ScheduleBuilderBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a ScheduleBuilderBlock object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ConfigFactoryInterface $config_factory) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    // Note: Cannot access injected services here as this is called during construction.
    // Use PHP's default timezone as fallback; actual site timezone will be available
    // when the block form is displayed.
    return [
      'search_context_selector' => '',
      'event_container_selector' => '',
      'event_title_selector' => 'h2, h3, .title, .summary',
      'event_start_time_selector' => '.start-time, [data-start-time]',
      'event_end_time_selector' => '.end-time, [data-end-time]',
      'event_date_selector' => '',
      'event_location_selector' => '.location, .venue, [data-location]',
      'event_description_selector' => '.description, .speaker',
      'event_link_selector' => 'a.session-link, a[href]',
      'timezone' => date_default_timezone_get(),
      'localStorage_key' => '',
      'ics_filename' => 'schedule-selected-events',
      'checkbox_position' => 'beginning',
      'checkbox_extra_classes' => '',
      'download_button_label' => 'Download Selected Events as ICS',
      'download_button_extra_classes' => '',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $config = $this->getConfiguration();

    // Get timezone options.
    $timezones = [];
    foreach (timezone_identifiers_list() as $tz) {
      $timezones[$tz] = $tz;
    }

    // If timezone is not yet set or is using PHP default, use site's default timezone.
    $default_timezone = $config['timezone'];
    if (empty($default_timezone) || $default_timezone === date_default_timezone_get()) {
      $system_config = $this->configFactory->get('system.date');
      $site_timezone = $system_config->get('timezone.default');
      if (!empty($site_timezone)) {
        $default_timezone = $site_timezone;
      }
    }

    $form['search_context_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Search Context Selector'),
      '#description' => $this->t('Optional: CSS selector for the container to search within (e.g., ".view-content", "#main-content"). Leave empty to search the entire document.'),
      '#default_value' => $config['search_context_selector'],
      '#required' => FALSE,
    ];

    $form['event_container_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Container Selector'),
      '#description' => $this->t('CSS selector to identify each event item on the page (e.g., ".session-item", ".event-card"). This is required.'),
      '#default_value' => $config['event_container_selector'],
      '#required' => TRUE,
    ];

    $form['event_title_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Title Selector'),
      '#description' => $this->t('Selector relative to event container for the event title/summary (e.g., "h2", ".session-title").'),
      '#default_value' => $config['event_title_selector'],
      '#required' => TRUE,
    ];

    $form['event_start_time_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Start Time Selector'),
      '#description' => $this->t('Selector for start time relative to event container. Supports data attributes (e.g., "[data-start-time]") or text content.'),
      '#default_value' => $config['event_start_time_selector'],
      '#required' => TRUE,
    ];

    $form['event_end_time_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event End Time Selector'),
      '#description' => $this->t('Selector for end time relative to event container. Supports data attributes (e.g., "[data-end-time]") or text content.'),
      '#default_value' => $config['event_end_time_selector'],
      '#required' => TRUE,
    ];

    $form['event_date_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Date Selector'),
      '#description' => $this->t('Optional: Selector for event date if not included in start/end time. Leave empty to extract date from start time.'),
      '#default_value' => $config['event_date_selector'],
      '#required' => FALSE,
    ];

    $form['event_location_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Location Selector'),
      '#description' => $this->t('Optional: Selector for location/venue (e.g., ".location", "[data-location]").'),
      '#default_value' => $config['event_location_selector'],
      '#required' => FALSE,
    ];

    $form['event_description_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Description Selector'),
      '#description' => $this->t('Optional: Selector for event description or speaker info (e.g., ".description", ".speaker").'),
      '#default_value' => $config['event_description_selector'],
      '#required' => FALSE,
    ];

    $form['event_link_selector'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Event Link Selector'),
      '#description' => $this->t('Optional: Selector for event URL (link element or href attribute, e.g., "a.session-link").'),
      '#default_value' => $config['event_link_selector'],
      '#required' => FALSE,
    ];

    $form['timezone'] = [
      '#type' => 'select',
      '#title' => $this->t('Timezone'),
      '#description' => $this->t('Timezone for ICS file generation. Defaults to site timezone.'),
      '#options' => $timezones,
      '#default_value' => $default_timezone,
      '#required' => TRUE,
    ];

    $block_id = $this->getPluginId() . '_' . $this->getDerivativeId();
    $default_key = 'schedule_builder_selections_' . preg_replace('/[^a-z0-9_]/', '_', strtolower($block_id));

    $form['localStorage_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('LocalStorage Key'),
      '#description' => $this->t('Unique key for storing selections in browser localStorage. Should be unique per block instance.'),
      '#default_value' => $config['localStorage_key'] ?: $default_key,
      '#required' => TRUE,
      '#pattern' => '[a-zA-Z0-9_]+',
    ];

    $form['ics_filename'] = [
      '#type' => 'textfield',
      '#title' => $this->t('ICS Filename'),
      '#description' => $this->t('Filename for downloaded ICS file (without .ics extension).'),
      '#default_value' => $config['ics_filename'],
      '#required' => TRUE,
      '#pattern' => '[a-zA-Z0-9_-]+',
    ];

    $form['checkbox_position'] = [
      '#type' => 'select',
      '#title' => $this->t('Checkbox Position'),
      '#description' => $this->t('Where to place the checkbox in the event container.'),
      '#options' => [
        'beginning' => $this->t('At the beginning of container'),
        'end' => $this->t('At the end of container'),
      ],
      '#default_value' => $config['checkbox_position'],
    ];

    $form['checkbox_extra_classes'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Extra Classes for Checkbox'),
      '#description' => $this->t('Additional CSS classes to add to the checkbox element (space-separated, e.g., "form-check-input").'),
      '#default_value' => $config['checkbox_extra_classes'],
      '#required' => FALSE,
    ];

    $form['download_button_label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Download Button Label'),
      '#description' => $this->t('The text displayed on the download button.'),
      '#default_value' => $config['download_button_label'],
      '#required' => TRUE,
    ];

    $form['download_button_extra_classes'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Extra Classes for Download Button'),
      '#description' => $this->t('Additional CSS classes to add to the download button (space-separated, e.g., "btn btn-primary").'),
      '#default_value' => $config['download_button_extra_classes'],
      '#required' => FALSE,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockValidate($form, FormStateInterface $form_state) {
    $values = $form_state->getValues();

    // Validate selectors are not empty for required fields.
    $required_fields = [
      'event_container_selector',
      'event_title_selector',
      'event_start_time_selector',
      'event_end_time_selector',
    ];

    foreach ($required_fields as $field) {
      if (empty($values[$field])) {
        $form_state->setErrorByName($field, $this->t('@field is required.', ['@field' => $form[$field]['#title']]));
      }
    }

    // Validate localStorage key format.
    if (!empty($values['localStorage_key']) && !preg_match('/^[a-zA-Z0-9_]+$/', $values['localStorage_key'])) {
      $form_state->setErrorByName('localStorage_key', $this->t('LocalStorage key can only contain letters, numbers, and underscores.'));
    }

    // Validate ICS filename format.
    if (!empty($values['ics_filename']) && !preg_match('/^[a-zA-Z0-9_-]+$/', $values['ics_filename'])) {
      $form_state->setErrorByName('ics_filename', $this->t('ICS filename can only contain letters, numbers, hyphens, and underscores.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $this->setConfigurationValue('search_context_selector', $form_state->getValue('search_context_selector'));
    $this->setConfigurationValue('event_container_selector', $form_state->getValue('event_container_selector'));
    $this->setConfigurationValue('event_title_selector', $form_state->getValue('event_title_selector'));
    $this->setConfigurationValue('event_start_time_selector', $form_state->getValue('event_start_time_selector'));
    $this->setConfigurationValue('event_end_time_selector', $form_state->getValue('event_end_time_selector'));
    $this->setConfigurationValue('event_date_selector', $form_state->getValue('event_date_selector'));
    $this->setConfigurationValue('event_location_selector', $form_state->getValue('event_location_selector'));
    $this->setConfigurationValue('event_description_selector', $form_state->getValue('event_description_selector'));
    $this->setConfigurationValue('event_link_selector', $form_state->getValue('event_link_selector'));
    $this->setConfigurationValue('timezone', $form_state->getValue('timezone'));
    $this->setConfigurationValue('localStorage_key', $form_state->getValue('localStorage_key'));
    $this->setConfigurationValue('ics_filename', $form_state->getValue('ics_filename'));
    $this->setConfigurationValue('checkbox_position', $form_state->getValue('checkbox_position'));
    $this->setConfigurationValue('checkbox_extra_classes', $form_state->getValue('checkbox_extra_classes'));
    $this->setConfigurationValue('download_button_label', $form_state->getValue('download_button_label'));
    $this->setConfigurationValue('download_button_extra_classes', $form_state->getValue('download_button_extra_classes'));
  }

  /**
   * Generates a unique block ID for this instance.
   *
   * @return string
   *   The unique block ID.
   */
  protected function generateBlockId() {
    $config = $this->getConfiguration();
    $block_id = $this->getPluginId();
    if (!empty($config['localStorage_key'])) {
      // Use localStorage key as part of ID to ensure uniqueness.
      $block_id .= '_' . preg_replace('/[^a-z0-9_]/', '_', strtolower($config['localStorage_key']));
    }
    else {
      // Fallback: use a hash of configuration.
      $block_id .= '_' . substr(md5(serialize($config)), 0, 8);
    }
    return $block_id;
  }

  /**
   * Converts block settings to JavaScript settings array.
   *
   * @param string $block_id
   *   The unique block ID.
   *
   * @return array
   *   The JavaScript settings array.
   */
  protected function convertSettingsToJs($block_id) {
    $config = $this->getConfiguration();
    return [
      'blockId' => $block_id,
      'selectors' => [
        'searchContext' => $config['search_context_selector'] ?: NULL,
        'eventContainer' => $config['event_container_selector'],
        'title' => $config['event_title_selector'],
        'startTime' => $config['event_start_time_selector'],
        'endTime' => $config['event_end_time_selector'],
        'date' => $config['event_date_selector'] ?: NULL,
        'location' => $config['event_location_selector'] ?: NULL,
        'description' => $config['event_description_selector'] ?: NULL,
        'link' => $config['event_link_selector'] ?: NULL,
      ],
      'timezone' => $config['timezone'],
      'localStorageKey' => $config['localStorage_key'],
      'icsFilename' => $config['ics_filename'],
      'checkboxPosition' => $config['checkbox_position'],
      'checkboxExtraClasses' => $config['checkbox_extra_classes'] ?: NULL,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $block_id = $this->generateBlockId();
    $settings = $this->convertSettingsToJs($block_id);
    $config = $this->getConfiguration();

    $build = [
      '#theme' => 'schedule_builder_block',
      '#block_id' => $block_id,
      '#download_button_label' => $config['download_button_label'],
      '#download_button_extra_classes' => $config['download_button_extra_classes'],
      '#attached' => [
        'library' => [
          'schedule_builder/schedule-builder',
        ],
        'drupalSettings' => [
          'scheduleBuilder' => [
            $block_id => $settings,
          ],
        ],
      ],
    ];

    return $build;
  }

}

