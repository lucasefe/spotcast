TODO.md

* Handle

  data: {
    error: {
      status: 404,
      message: 'Player command failed: No active device found',
      reason: 'NO_ACTIVE_DEVICE'
    }
  }

  From the player we can see if there's a device and if it's active. We should only alow connecting if device is available.


* Save last updated at from player broadcasting